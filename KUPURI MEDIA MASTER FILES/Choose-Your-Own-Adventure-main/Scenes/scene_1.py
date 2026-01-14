# scene_1.py

def play_scene():
    """
    Scene 1 Template:
    - Section A (Choice 1)
    - Section B (Choice 2)
    - Returns the name of the next scene (e.g., "scene_2") or "quit".
    """
    
    print("\n=== SCENE 1 ===")
    print("Section A: [Describe your setting here]")
    
    # Example of a first choice for Section A
    choice_a = input("You can choose 'explore' or 'exit': ").lower().strip()
    
    if choice_a == "explore":
        print("You decide to look around the area, searching for anything of interest...")
        # Placeholder for story/logic
    elif choice_a == "exit":
        print("You decide to leave immediately, feeling uneasy...")
        # Placeholder for story/logic
    else:
        print("Invalid choice. Let's assume you explore anyway.")

    print("\n--- Moving to Section B of Scene 1 ---")
    print("Section B: [Provide more story context or a second setting]")
    
    # Example of a second choice for Section B
    choice_b = input("Do you 'follow' the strange noise or 'ignore' it? ").lower().strip()
    
    if choice_b == "follow":
        print("You follow the noise into a dark corridor...")
        # Decide the next scene
        return "scene_2"
    elif choice_b == "ignore":
        print("You ignore the noise and stay put, but something else catches your eye...")
        # Possibly go to a different scene or move forward
        return "scene_2"
    else:
        print("Not sure what that means. Let's assume you follow the noise anyway.")
        return "scene_2"
