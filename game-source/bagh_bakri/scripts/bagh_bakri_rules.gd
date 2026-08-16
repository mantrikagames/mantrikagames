# ==============================================================================
# Mantrika Games — Bagh Bakri (Tigers & Goats): GDScript Rules Engine
# ==============================================================================
class_name BaghBakriRules
extends RefCounted

const BOARD_SIZE: int = 5
const TOTAL_GOATS: int = 20
const TIGERS_COUNT: int = 4

# 5x5 Adjacency Graph with Diagonals
static func get_neighbors(node: Vector2i) -> Array[Vector2i]:
	var n: Array[Vector2i] = []
	var r = node.x
	var c = node.y
	# Orthogonal
	if r > 0: n.append(Vector2i(r - 1, c))
	if r < 4: n.append(Vector2i(r + 1, c))
	if c > 0: n.append(Vector2i(r, c - 1))
	if c < 4: n.append(Vector2i(r, c + 1))
	# Diagonals exist on nodes where (r + c) is even
	if (r + c) % 2 == 0:
		if r > 0 and c > 0: n.append(Vector2i(r - 1, c - 1))
		if r > 0 and c < 4: n.append(Vector2i(r - 1, c + 1))
		if r < 4 and c > 0: n.append(Vector2i(r + 1, c - 1))
		if r < 4 and c < 4: n.append(Vector2i(r + 1, c + 1))
	return n

var tigers: Array[Vector2i] = []
var goats: Array[Vector2i] = []
var goats_placed_count: int = 0
var goats_captured_count: int = 0
var turn: String = "goat" # "goat" or "tiger"
var winner: String = ""

func init_game() -> void:
	# 4 Tigers start at 4 corners
	tigers = [Vector2i(0, 0), Vector2i(0, 4), Vector2i(4, 0), Vector2i(4, 4)]
	goats.clear()
	goats_placed_count = 0
	goats_captured_count = 0
	turn = "goat"
	winner = ""
