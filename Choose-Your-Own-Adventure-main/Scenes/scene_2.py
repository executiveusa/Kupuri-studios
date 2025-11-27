# scene_2.py

def play_scene():
    """
    Scene 2 Template:
    - Section A (Choice 1)
    - Section B (Choice 2)
    - Returns the name of the next scene (e.g., "scene_3") or "quit".
    """

    print("\n=== SCENE 2 ===")
    print("Section A: [Describe your new setting here]")
    
    choice_a = input("You can choose 'search' the area or 'move on': ").lower().strip()

    if choice_a == "search":
        print("You search carefully and find a mysterious item...")
        # Placeholder logic
    elif choice_a == "move on":
        print("You decide to keep going without lingering...")
        # Placeholder logic
    else:
        print("Unrecognized choice. You hesitate, but time moves on.")
    
    print("\n--- Moving to Section B of Scene 2 ---")
    print("Section B: [Provide a second part of the story or challenge]")
    
    choice_b = input("Do you 'investigate' a nearby noise or 'ignore' and proceed forward? ").lower().strip()

    if choice_b == "investigate":
        print("You approach the source of the noise cautiously...")
        return "scene_3"
    elif choice_b == "ignore":
        print("You choose to ignore the noise and continue...")
        return "scene_3"
    else:
        print("Unclear action. Let's assume you continue onward.")
        return "scene_3"

