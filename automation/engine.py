import urllib.parse
from typing import Dict, Any


class AutomationEngine:
    """
    Automates viral loops, deep links, milestone notifications, and calendar invites.
    """

    @staticmethod
    def generate_whatsapp_share_url(referral_code: str, student_name: str, frontend_url: str = "http://localhost:5173") -> str:
        """
        Creates an optimized WhatsApp deep-link message with personal tracking parameter.
        """
        base = frontend_url.rstrip("/")
        deep_link = f"{base}/register?ref={referral_code}"
        message = (
            f"Hey! I just registered for the free workshop 'Build Your First AI Project in 60 Minutes'. "
            f"We walk away with a live AI project URL to add directly to our resumes for placements. "
            f"It's completely free for final-year engineering students. "
            f"Grab your slot before the 500 seats fill up: {deep_link}"
        )
        encoded_message = urllib.parse.quote(message)
        return f"https://api.whatsapp.com/send?text={encoded_message}"

    @staticmethod
    def generate_email_share_url(referral_code: str, student_name: str, frontend_url: str = "http://localhost:5173") -> str:
        """
        Creates a pre-filled mailto link for direct 1-click email invitation.
        """
        base = frontend_url.rstrip("/")
        deep_link = f"{base}/register?ref={referral_code}"
        subject = "Invitation: Build Your First AI Project in 60 Minutes (Free Masterclass)"
        body = (
            f"Hi,\n\n"
            f"I have registered for the upcoming free workshop 'Build Your First AI Project in 60 Minutes'.\n"
            f"We will build and deploy a real working AI application that we can showcase directly on our resumes for final-year placements.\n\n"
            f"Seats are strictly capped at 500 verified engineering students. Use my referral link to claim your seat:\n"
            f"{deep_link}\n\n"
            f"Best,\n"
            f"{student_name}"
        )
        return f"mailto:?subject={urllib.parse.quote(subject)}&body={urllib.parse.quote(body)}"

    @staticmethod
    def evaluate_referral_milestones(referral_count: int) -> Dict[str, Any]:
        """
        Calculates unlocked student incentives across Phase 5 milestones (1, 3, 5, 10).
        Strictly adheres to workshop-aligned educational materials and recognition.
        """
        milestones = [
            {
                "target": 1,
                "title": "Project Architect Kit",
                "reward": "Top 25 AI Project Prompts & Architecture Blueprints",
                "unlocked": referral_count >= 1,
                "progress_percent": min(100.0, round((referral_count / 1.0) * 100, 1)),
            },
            {
                "target": 3,
                "title": "Starter Codebase & Priority Pass",
                "reward": "Complete AI Starter Codebase & Certificate Priority Seat",
                "unlocked": referral_count >= 3,
                "progress_percent": min(100.0, round((referral_count / 3.0) * 100, 1)),
            },
            {
                "target": 5,
                "title": "Faculty Fast-Track",
                "reward": "Exclusive Live Q&A Fast-Track Access with Lead Instructor",
                "unlocked": referral_count >= 5,
                "progress_percent": min(100.0, round((referral_count / 5.0) * 100, 1)),
            },
            {
                "target": 10,
                "title": "Campus AI Ambassador",
                "reward": "Campus AI Ambassador Digital Badge & Hall of Fame Recognition",
                "unlocked": referral_count >= 10,
                "progress_percent": min(100.0, round((referral_count / 10.0) * 100, 1)),
            },
        ]

        tier_1_unlocked = referral_count >= 1
        tier_2_unlocked = referral_count >= 3
        tier_3_unlocked = referral_count >= 5
        tier_4_unlocked = referral_count >= 10

        # Next milestone calculation
        if referral_count < 1:
            next_target = 1
        elif referral_count < 3:
            next_target = 3
        else:
            next_target = "All Rewards Unlocked"

        if referral_count < 1:
            next_milestone_target = 1
        elif referral_count < 3:
            next_milestone_target = 3
        elif referral_count < 5:
            next_milestone_target = 5
        elif referral_count < 10:
            next_milestone_target = 10
        else:
            next_milestone_target = "All Milestones Achieved"

        return {
            "referral_count": referral_count,
            "milestones": milestones,
            "tier_1_unlocked": tier_1_unlocked,
            "tier_1_reward": "Top 25 AI Project Prompts & Architecture Blueprints" if tier_1_unlocked else "Locked (Requires 1 Referral)",
            "tier_2_unlocked": tier_2_unlocked,
            "tier_2_reward": "Complete AI Starter Codebase & Certificate Priority Seat" if tier_2_unlocked else "Locked (Requires 3 Referrals)",
            "tier_3_unlocked": tier_3_unlocked,
            "tier_3_reward": "Exclusive Live Q&A Fast-Track Access with Lead Instructor" if tier_3_unlocked else "Locked (Requires 5 Referrals)",
            "tier_4_unlocked": tier_4_unlocked,
            "tier_4_reward": "Campus AI Ambassador Digital Badge & Hall of Fame Recognition" if tier_4_unlocked else "Locked (Requires 10 Referrals)",
            "next_target": next_target,
            "next_milestone_target": next_milestone_target,
        }

    @staticmethod
    def generate_ics_calendar_invite(workshop_title: str = "Build Your First AI Project in 60 Minutes") -> str:
        """
        Generates an iCalendar (.ics) string for frictionless 1-click addition to Google / Outlook Calendar.
        """
        return (
            "BEGIN:VCALENDAR\r\n"
            "VERSION:2.0\r\n"
            "PRODID:-//NxtWave//AI Masterclass//EN\r\n"
            "BEGIN:VEVENT\r\n"
            "SUMMARY:" + workshop_title + "\r\n"
            "DESCRIPTION:Join NxtWave to build and deploy your first live AI project in 60 minutes.\r\n"
            "STATUS:CONFIRMED\r\n"
            "END:VEVENT\r\n"
            "END:VCALENDAR\r\n"
        )
