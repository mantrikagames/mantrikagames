# ==============================================================================
# Mantrika Games — Chowka Bara: Pure GDScript Rules & State Engine
# ==============================================================================
class_name ChowkaBaraRules
extends RefCounted

const BOARD_SIZE: int = 5
const PAWNS_PER_PLAYER: int = 4
const TOTAL_PATH_LENGTH: int = 25 # Index 0 (home) to 24 (Ghar)

# Coordinates for all 25 cells (row, col)
# Safe Kattas (marked with 'X')
const SAFE_CELLS: Array[Vector2i] = [
	Vector2i(4, 2), # South Home (Player 0)
	Vector2i(2, 4), # East Home (Player 1)
	Vector2i(0, 2), # North Home (Player 2)
	Vector2i(2, 0), # West Home (Player 3)
	Vector2i(2, 2)  # Central Ghar / Goal
]

# Player Path Definitions from Start (step 0) to Ghar (step 24)
# Outer Loop (0 to 15) is Anti-Clockwise
# Inner Loop (16 to 23) is Clockwise
# Step 24 is Center Ghar (2, 2)
static var PLAYER_PATHS: Dictionary = {
	0: [ # Player 0 (South - Red)
		Vector2i(4, 2), Vector2i(4, 3), Vector2i(4, 4), Vector2i(3, 4),
		Vector2i(2, 4), Vector2i(1, 4), Vector2i(0, 4), Vector2i(0, 3),
		Vector2i(0, 2), Vector2i(0, 1), Vector2i(0, 0), Vector2i(1, 0),
		Vector2i(2, 0), Vector2i(3, 0), Vector2i(4, 0), Vector2i(4, 1),
		# Inner loop entry after completing outer loop:
		Vector2i(3, 1), Vector2i(3, 2), Vector2i(3, 3), Vector2i(2, 3),
		Vector2i(1, 3), Vector2i(1, 2), Vector2i(1, 1), Vector2i(2, 1),
		Vector2i(2, 2) # Ghar
	],
	1: [ # Player 1 (East - Gold)
		Vector2i(2, 4), Vector2i(1, 4), Vector2i(0, 4), Vector2i(0, 3),
		Vector2i(0, 2), Vector2i(0, 1), Vector2i(0, 0), Vector2i(1, 0),
		Vector2i(2, 0), Vector2i(3, 0), Vector2i(4, 0), Vector2i(4, 1),
		Vector2i(4, 2), Vector2i(4, 3), Vector2i(4, 4), Vector2i(3, 4),
		# Inner loop:
		Vector2i(3, 3), Vector2i(2, 3), Vector2i(1, 3), Vector2i(1, 2),
		Vector2i(1, 1), Vector2i(2, 1), Vector2i(3, 1), Vector2i(3, 2),
		Vector2i(2, 2)
	],
	2: [ # Player 2 (North - Green)
		Vector2i(0, 2), Vector2i(0, 1), Vector2i(0, 0), Vector2i(1, 0),
		Vector2i(2, 0), Vector2i(3, 0), Vector2i(4, 0), Vector2i(4, 1),
		Vector2i(4, 2), Vector2i(4, 3), Vector2i(4, 4), Vector2i(3, 4),
		Vector2i(2, 4), Vector2i(1, 4), Vector2i(0, 4), Vector2i(0, 3),
		# Inner loop:
		Vector2i(1, 3), Vector2i(1, 2), Vector2i(1, 1), Vector2i(2, 1),
		Vector2i(3, 1), Vector2i(3, 2), Vector2i(3, 3), Vector2i(2, 3),
		Vector2i(2, 2)
	],
	3: [ # Player 3 (West - Blue)
		Vector2i(2, 0), Vector2i(3, 0), Vector2i(4, 0), Vector2i(4, 1),
		Vector2i(4, 2), Vector2i(4, 3), Vector2i(4, 4), Vector2i(3, 4),
		Vector2i(2, 4), Vector2i(1, 4), Vector2i(0, 4), Vector2i(0, 3),
		Vector2i(0, 2), Vector2i(0, 1), Vector2i(0, 0), Vector2i(1, 0),
		# Inner loop:
		Vector2i(1, 1), Vector2i(2, 1), Vector2i(3, 1), Vector2i(3, 2),
		Vector2i(3, 3), Vector2i(2, 3), Vector2i(1, 3), Vector2i(1, 2),
		Vector2i(2, 2)
	]
}

# State properties
var num_players: int = 2
var active_players: Array[int] = [0, 2] # Default 2 players: South (0) vs North (2)
var current_player_idx: int = 0
var pawns: Dictionary = {} # player_id -> Array of step positions (0 to 24)
var has_captured: Dictionary = {} # player_id -> bool
var current_roll: int = 0
var cowrie_faces: Array[int] = [0, 0, 0, 0] # 1 = mouth open, 0 = closed
var winner: int = -1

func init_game(players_count: int = 2) -> void:
	num_players = players_count
	if num_players == 2:
		active_players = [0, 2] # South & North
	else:
		active_players = [0, 1, 2, 3] # South, East, North, West
		
	pawns.clear()
	has_captured.clear()
	for p in active_players:
		pawns[p] = [0, 0, 0, 0] # All 4 pawns start at home base (step 0)
		has_captured[p] = false
		
	current_player_idx = 0
	current_roll = 0
	winner = -1

func roll_cowries() -> Dictionary:
	# 4 independent cowrie shells (each 50% chance open/mouth up)
	var open_count: int = 0
	cowrie_faces = []
	for i in range(4):
		var face: int = 1 if randf() < 0.5 else 0
		cowrie_faces.append(face)
		if face == 1:
			open_count += 1
			
	var score: int = 0
	var grants_bonus: bool = false
	match open_count:
		1: score = 1
		2: score = 2
		3: score = 3
		4:
			score = 4 # Chowka
			grants_bonus = true
		0:
			score = 8 # Ashta / Bara
			grants_bonus = true
			
	current_roll = score
	return {
		"score": score,
		"faces": cowrie_faces.duplicate(),
		"bonus_roll": grants_bonus,
		"player": active_players[current_player_idx]
	}

func get_cell_coord(player_id: int, step_index: int) -> Vector2i:
	var path: Array = PLAYER_PATHS[player_id]
	if step_index >= 0 and step_index < path.size():
		return path[step_index]
	return Vector2i(-1, -1)

func is_cell_safe(coord: Vector2i) -> bool:
	return coord in SAFE_CELLS

func get_legal_moves(player_id: int, roll_value: int) -> Array[Dictionary]:
	var legal_moves: Array[Dictionary] = []
	if roll_value <= 0 or winner != -1:
		return legal_moves
		
	var player_pawns: Array = pawns[player_id]
	var can_enter_inner: bool = has_captured[player_id]
	
	for pawn_idx in range(PAWNS_PER_PLAYER):
		var current_step: int = player_pawns[pawn_idx]
		
		# If pawn already at Ghar (step 24), it is home and cannot move
		if current_step >= 24:
			continue
			
		var target_step: int = current_step + roll_value
		
		# If player has NOT captured, pawns must loop the outer 16 squares (steps 0 to 15)
		if not can_enter_inner and target_step > 15:
			# Wrap around the 16 outer squares
			target_step = target_step % 16
			
		# If target exceeds step 24 (Ghar), exact roll is required
		if target_step > 24:
			continue
			
		var from_coord: Vector2i = get_cell_coord(player_id, current_step)
		var to_coord: Vector2i = get_cell_coord(player_id, target_step)
		
		# Check for opponent pawns on target square
		var capture_pawn: Dictionary = {}
		var is_safe: bool = is_cell_safe(to_coord)
		
		if not is_safe and target_step < 24:
			for other_p in active_players:
				if other_p == player_id:
					continue
				var other_pawns: Array = pawns[other_p]
				for opp_idx in range(PAWNS_PER_PLAYER):
					var opp_step = other_pawns[opp_idx]
					var opp_coord = get_cell_coord(other_p, opp_step)
					if opp_coord == to_coord and opp_step < 24:
						capture_pawn = {
							"opponent_player": other_p,
							"opponent_pawn_idx": opp_idx
						}
						break
				if not capture_pawn.is_empty():
					break
					
		legal_moves.append({
			"pawn_idx": pawn_idx,
			"from_step": current_step,
			"to_step": target_step,
			"from_coord": from_coord,
			"to_coord": to_coord,
			"is_capture": not capture_pawn.is_empty(),
			"capture_data": capture_pawn,
			"reaches_ghar": (target_step == 24)
		})
		
	return legal_moves

func apply_move(player_id: int, move: Dictionary) -> Dictionary:
	var pawn_idx: int = move["pawn_idx"]
	var target_step: int = move["to_step"]
	
	pawns[player_id][pawn_idx] = target_step
	var earned_extra_turn: bool = (current_roll == 4 or current_roll == 8)
	
	if move["is_capture"]:
		var cap = move["capture_data"]
		var opp_player: int = cap["opponent_player"]
		var opp_pawn: int = cap["opponent_pawn_idx"]
		# Send opponent pawn back to base
		pawns[opp_player][opp_pawn] = 0
		has_captured[player_id] = true
		earned_extra_turn = true # Capturing grants an extra turn!
		
	# Check for victory
	var all_home: bool = true
	for step in pawns[player_id]:
		if step != 24:
			all_home = false
			break
			
	if all_home:
		winner = player_id
		
	return {
		"player": player_id,
		"pawn_idx": pawn_idx,
		"to_step": target_step,
		"is_capture": move["is_capture"],
		"extra_turn": earned_extra_turn,
		"game_over": (winner != -1),
		"winner": winner
	}

func pass_turn() -> int:
	current_player_idx = (current_player_idx + 1) % active_players.size()
	current_roll = 0
	return active_players[current_player_idx]
