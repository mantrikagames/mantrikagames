# ==============================================================================
# Mantrika Games — Shared 3D Game Framework: Base Game State & Turn Controller
# ==============================================================================
class_name BaseGameState
extends RefCounted

signal state_changed(new_state: String)
signal turn_changed(player_index: int)
signal move_executed(player_index: int, move_data: Dictionary)
signal game_over(winner_player_index: int)

enum TurnPhase {
	IDLE,
	ROLLING,
	SELECTING_PIECE,
	MOVING_PIECE,
	RESOLVING_ACTIONS,
	TURN_END,
	GAME_FINISHED
}

var current_phase: TurnPhase = TurnPhase.IDLE
var current_player: int = 0
var total_players: int = 2
var winner: int = -1
var turn_counter: int = 0
var history: Array = []

func initialize(num_players: int) -> void:
	total_players = clamp(num_players, 2, 4)
	current_player = 0
	winner = -1
	turn_counter = 1
	current_phase = TurnPhase.IDLE
	history.clear()

func next_turn() -> int:
	current_player = (current_player + 1) % total_players
	turn_counter += 1
	turn_changed.emit(current_player)
	return current_player

func set_phase(new_phase: TurnPhase) -> void:
	current_phase = new_phase
	state_changed.emit(str(new_phase))

func record_move(move_dict: Dictionary) -> void:
	history.append({
		"turn": turn_counter,
		"player": current_player,
		"data": move_dict.duplicate(true)
	})
	move_executed.emit(current_player, move_dict)

func finish_game(winning_player: int) -> void:
	winner = winning_player
	set_phase(TurnPhase.GAME_FINISHED)
	game_over.emit(winner)
