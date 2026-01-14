# main.py
# Entry point for the text-based adventure game.

from Scenes import scene_1, scene_2, scene_3, scene_4 

def start_game():
    """Starts the game loop and transitions between scenes."""
    current_scene = "scene_1"
    
    while True:
        if current_scene == "scene_1":
            current_scene = scene_1.play_scene()
        elif current_scene == "scene_2":
            current_scene = scene_2.play_scene()
        elif current_scene == "scene_3":
            current_scene = scene_3.play_scene()
        elif current_scene == "scene_4":
            current_scene = scene_4.play_scene()
        elif current_scene == "quit":
            print("\nThanks for playing! Goodbye.")
            break
        else:
            print("\nUnknown scene. Exiting the game.")
            break

if __name__ == "__main__":
    print("Welcome to Choose Your Own Adventure!")
    print("Be ready to for an exciting adventure")
    print("Driven completly by your decisions")
    start_game()
