
player_name: str = ""
room: str = "eiffel tower"
has_baguette: bool = False
moves: int = 0


def say(text):
    print(text)
    print()


def ask():
    return input("> ").strip().lower()


print("=" * 44)
print("       FRANCE")
print("=" * 44)
print()

player_name = input("What is your name, young tourist ?").strip()
if player_name == "":
    player_name = "Ratatouille"

print()
print("Welcome, " + player_name + ".")
print("You stand infront the eiffel tower in the middle of Paris.")
print("A Taxi way leads EAST,  and a beautiful restaurant hums nearby.")
say("The air crackles with strange pollution . Type HELP if you get stuck, or QUIT to walk away.")


while True:
    command = ask()
    moves = moves + 1

    if command == "quit":
        say("You leave the city, but the baguette smell follows you. " + player_name + " lasted " + str(moves) + " moves.")
        break

    elif command == "help":
        say("Try: LOOK, EAST, WEST, TAKE BAGUETTE, OPEN DOOR, QUIT")

    elif room == "eiffel tower":
        if command == "look":
            if has_baguette:
                say("The alley glows with lingering energy, but the baguette is gone.")
            else:
                say("une baguette bien racit sur le sol humide de paris.")

        elif command == "take baguette":
            if has_baguette:
                say("You already carry the baguette. Its warmth is comforting in your hand.")
            else:
                has_baguette = True
                say("You lift the baguette. A burst of warmth spreads through your fingers.")

        elif command == "east":
            room = "restaurant"
            print("You follow ratatouille into a big restaurant.")
            say("The air grows warmer, and a shadowy path leads back WEST.")

        else:
            say("That move feels wrong for a tourist in this city.")

    elif room == "restaurant":
        if command == "look":
            say("a beautiful door is infront of you, will you open it ?")

        elif command == "west":
            room = "eiffel tower"
            say("You return to the Eiffel Tower beneath the Parisian sky.")

        elif command == "open door":
            if has_baguette:
                print("The baguette locks into the portal. The room erupts in golden light.")
                print("Beyond it, a hidden giant croissant awaits.")
                say("You become a legend, " + player_name + " — in " + str(moves) + " moves.")
                break
            else:
                say("The door remains shut. It needs the baguette.")

        else:
            say("You cannot do that here.")
