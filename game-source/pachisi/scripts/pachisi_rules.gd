# ==============================================================================
# Mantrika Games — Pachisi: GDScript Rules & State Engine
# ==============================================================================
class_name PachisiRules
extends RefCounted

const PAWNS_PER_PLAYER: int = 4
const TOTAL_PLAYERS: int = 4

# 6 Cowrie Shell Scoring:
# 5 up = 25 (Pachis), 1 up = 10, 2 up = 2, 3 up = 3, 4 up = 4, 6 up = 6, 0 up = 6 (or 12)
static func score_cowries(faces: Array[int]) -> Dictionary:
	var open_count = 0
	for f in faces:
		if f == 1:
			open_count += 1
	var score = 0
	var bonus = false
	match open_count:
		5:
			score = 25
			bonus = true
		1:
			score = 10
			bonus = true
		2: score = 2
		3: score = 3
		4: score = 4
		6:
			score = 6
			bonus = true
		0:
			score = 6
			bonus = true
		_: score = 2
	return { "score": score, "bonus": bonus }

var num_players: int = 2
var active_players: Array[int] = [0, 2] # Default 2 players
var pawns: Dictionary = {} # p_id -> [step0, step1, step2, step3] (0 to 84, where 84 is Charkoni)
var winner: int = -1

func init_game(p_count: int = 2) -> void:
	num_players = p_count
	active_players = [0, 2] if num_players == 2 else [0, 1, 2, 3]
	pawns.clear()
	for p in active_players:
		pawns[p] = [0, 0, 0, 0]
	winner = -1
