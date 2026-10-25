from accounts.permissions import IsCareerTrainingAdvisor


class IsCareerAdvisorOrAdmin(IsCareerTrainingAdvisor):
    """
    Career & Training Advisor or administrator.

    The developer spec asks for this class by this name. The project already has the identical rule
    (accounts.permissions.IsCareerTrainingAdvisor, which also admits superusers), so this extends it
    instead of repeating it.
    """
