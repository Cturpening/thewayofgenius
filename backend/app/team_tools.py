"""Shared Inner Team write logic -- both app/main.py's /team-members
routes and Edin's own tool-calling (app/edin_tools.py) call into
create_member()/update_member() below, so a part Edin creates or updates
conversationally is the exact same write path as one added by hand in
the Psyche Dojo's Inner Team tab.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models import TeamMember
from app.track_b import run_track_b

_VALID_MODES = ("front", "background")

_DEFAULT_PALETTE = ("#E8735B", "#D4A94B", "#3F6B57", "#8e7ad1", "#7fb3a3")


def _next_color(db: Session, user_id: UUID) -> str:
    """Same rotation InnerTeamView.jsx already used client-side -- picking
    it here too means Edin creating a member gets a real, varied color
    the same way a manually-added one does, not always the first swatch."""
    count = db.query(TeamMember).filter(TeamMember.user_id == user_id).count()
    return _DEFAULT_PALETTE[count % len(_DEFAULT_PALETTE)]


def create_member(
    db: Session, user_id: UUID, *, name: str, mode: str = "front", color: str | None = None, role: str | None = None
) -> tuple[TeamMember, str | None]:
    combined_text = " ".join(t for t in (name, role) if t)
    crisis_response = run_track_b(db, user_id, combined_text) if combined_text else None
    member = TeamMember(
        user_id=user_id,
        name=name,
        mode=mode if mode in _VALID_MODES else "front",
        color=color or _next_color(db, user_id),
        role=role,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member, crisis_response


def find_members_by_name(db: Session, user_id: UUID, name: str) -> list[TeamMember]:
    return (
        db.query(TeamMember)
        .filter(TeamMember.user_id == user_id, TeamMember.name.ilike(f"%{name}%"))
        .order_by(TeamMember.created_at.asc())
        .all()
    )


def update_member(
    db: Session, user_id: UUID, *, member: TeamMember, name: str | None = None, role: str | None = None, task: str | None = None
) -> tuple[TeamMember, str | None]:
    combined_text = " ".join(t for t in (name, role, task) if t)
    crisis_response = run_track_b(db, user_id, combined_text) if combined_text else None
    if name is not None:
        member.name = name
    if role is not None:
        member.role = role
    if task is not None:
        member.task = task
    db.commit()
    db.refresh(member)
    return member, crisis_response


TOOL_DECLARATIONS = [
    {
        "name": "list_team_members",
        "description": "List the user's real Inner Team members with their exact names, roles, and current tasks -- use before update_team_member whenever you're not certain of a member's exact name.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "create_team_member",
        "description": "Create a new real Inner Team member -- use when the user names a new part of themselves they want to track, front-space or background.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "What the user calls this part."},
                "mode": {"type": "string", "enum": list(_VALID_MODES), "description": "front = active helper, background = runs quietly. Default to front if unclear."},
                "role": {"type": "string", "description": "What this part does/helps with, if the user says."},
            },
            "required": ["name"],
        },
    },
    {
        "name": "update_team_member",
        "description": "Update an existing Inner Team member's role or current task -- use when the user reports what a part is currently doing, or describes it differently than before.",
        "parameters": {
            "type": "object",
            "properties": {
                "member_name": {"type": "string", "description": "The member's name (or a close match), as the user refers to it."},
                "role": {"type": "string", "description": "New description of what this part does, if changing."},
                "task": {"type": "string", "description": "What this part is currently doing/working on, if the user is reporting that."},
            },
            "required": ["member_name"],
        },
    },
]


def make_executor(db: Session, user_id: UUID):
    def execute(name: str, args: dict) -> dict | None:
        if name == "list_team_members":
            members = db.query(TeamMember).filter(TeamMember.user_id == user_id).order_by(TeamMember.created_at.asc()).all()
            return {"members": [{"name": m.name, "mode": m.mode, "role": m.role, "task": m.task} for m in members]}

        if name == "create_team_member":
            member, crisis_response = create_member(
                db, user_id, name=args["name"], mode=args.get("mode", "front"), role=args.get("role")
            )
            if crisis_response:
                return {"saved": True, "crisis_response": crisis_response}
            return {"saved": True, "member_id": str(member.id), "name": member.name}

        if name == "update_team_member":
            matches = find_members_by_name(db, user_id, args["member_name"])
            if len(matches) == 0:
                return {"error": f"No team member matching '{args['member_name']}' was found -- ask the user to confirm the exact name, or call list_team_members."}
            if len(matches) > 1:
                return {
                    "error": f"More than one team member matches '{args['member_name']}' -- ask the user which one they mean.",
                    "candidates": [m.name for m in matches],
                }
            member, crisis_response = update_member(
                db, user_id, member=matches[0], role=args.get("role"), task=args.get("task")
            )
            if crisis_response:
                return {"updated": True, "crisis_response": crisis_response}
            return {"updated": True, "name": member.name, "role": member.role, "task": member.task}

        return None

    return execute
