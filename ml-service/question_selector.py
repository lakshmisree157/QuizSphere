import random
from collections import defaultdict

TOTAL_QUESTIONS = 10

target_distribution = {
    1: 0.15,  # Remember
    2: 0.25,  # Understand
    3: 0.25,  # Apply
    4: 0.2,   # Analyze
    5: 0.1,   # Evaluate
    6: 0.05   # Create
}

def calculate_target_counts(total_questions=TOTAL_QUESTIONS, distribution=target_distribution):
    target_counts = {level: int(total_questions * perc) for level, perc in distribution.items()}
    total_assigned = sum(target_counts.values())
    if total_assigned < total_questions:
        for level in [2, 3, 4]:
            target_counts[level] += 1
            total_assigned += 1
            if total_assigned == total_questions:
                break
    return target_counts

def select_questions(questions):
    """
    Select questions based on target distribution of Bloom levels.
    Args:
        questions (list of dict): List of question dicts with 'bloomLevel' key.
    Returns:
        list of dict: Selected questions.
    """
    target_counts = calculate_target_counts()
    questions_by_level = defaultdict(list)
    for q in questions:
        level = q.get('bloomLevel')
        if level in target_counts:
            questions_by_level[level].append(q)

    selected_questions = []
    for level, count_needed in target_counts.items():
        available_questions = questions_by_level.get(level, [])
        if available_questions:
            sample_size = min(count_needed, len(available_questions))
            selected = random.sample(available_questions, sample_size)
            selected_questions.extend(selected)

    return selected_questions
