# ==============================================================================
# Mantrika Games — Shared 3D Orbital Camera Controller
# ==============================================================================
class_name OrbitalCameraController
extends Node3D

@export var target_node: Node3D
@export var min_distance: float = 8.0
@export var max_distance: float = 24.0
@export var default_distance: float = 14.0
@export var rotation_speed: float = 0.005
@export var zoom_speed: float = 1.0
@export var smooth_damping: float = 10.0

var _yaw: float = 0.0
var _pitch: float = deg_to_rad(55.0)
var _target_yaw: float = 0.0
var _target_pitch: float = deg_to_rad(55.0)
var _current_distance: float = 14.0
var _target_distance: float = 14.0
var _is_dragging: bool = false
var _last_mouse_pos: Vector2 = Vector2.ZERO

@onready var camera_node: Camera3D = $Camera3D

func _ready() -> void:
	_target_distance = default_distance
	_current_distance = default_distance

func _process(delta: float) -> void:
	_yaw = lerp_angle(_yaw, _target_yaw, delta * smooth_damping)
	_pitch = lerp(_pitch, _target_pitch, delta * smooth_damping)
	_current_distance = lerp(_current_distance, _target_distance, delta * smooth_damping)
	
	var target_pos = target_node.global_position if target_node else Vector3.ZERO
	var offset = Vector3(
		_current_distance * sin(_yaw) * cos(_pitch),
		_current_distance * sin(_pitch),
		_current_distance * cos(_yaw) * cos(_pitch)
	)
	
	global_position = target_pos + offset
	if camera_node:
		camera_node.look_at(target_pos, Vector3.UP)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT or event.button_index == MOUSE_BUTTON_RIGHT:
			_is_dragging = event.pressed
			_last_mouse_pos = event.position
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_target_distance = clamp(_target_distance - zoom_speed, min_distance, max_distance)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_target_distance = clamp(_target_distance + zoom_speed, min_distance, max_distance)
			
	elif event is InputEventMouseMotion and _is_dragging:
		var delta = event.position - _last_mouse_pos
		_target_yaw -= delta.x * rotation_speed
		_target_pitch = clamp(_target_pitch + delta.y * rotation_speed, deg_to_rad(20.0), deg_to_rad(85.0))
		_last_mouse_pos = event.position

func reset_view() -> void:
	_target_yaw = 0.0
	_target_pitch = deg_to_rad(55.0)
	_target_distance = default_distance
