# scene_4.py

def play_scene():
    """
    Scene 4 Template (Often a 'final' or 'climax' scene):
    - Section A (Choice 1)
    - Section B (Choice 2)
    - Returns "quit" if the story ends, or maybe loops back to an earlier scene.
    """

    print("\n=== SCENE 4 ===")
    print("Section A: [Set the stage for a final confrontation or resolution]")
    
    choice_a = input("You can 'confront' the challenge or 'turn back': ").lower().strip()

    if choice_a == "confront":
        print("You gather your courage and face the threat head-on...")
        # Placeholder logic
    elif choice_a == "turn back":
        print("You hesitate and consider escaping before it's too late...")
        # Placeholder logic
    else:
        print("You freeze in fear, but time forces you to confront anyway.")

    print("\n--- Moving to Section B of Scene 4 ---")
    print("Section B: [Provide the final decision or resolution]")
    
    choice_b = input("Do you 'fight' or 'negotiate'? ").lower().strip()

    if choice_b == "fight":
        print("You engage in a fierce battle. Eventually, you emerge victorious—or not...")
        print("This might be the end of your journey!")
        return "quit"
    elif choice_b == "negotiate":
        print("You attempt to reason, forging a new path. The outcome is uncertain, but the journey ends here.")
        return "quit"
    else:
        print("No action taken. Fate decides for you. The adventure concludes.")
        return "quit"

