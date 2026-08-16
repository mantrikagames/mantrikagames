# ==============================================================================
# Mantrika Games — Shared Multi-Touch & Gesture Handler for Mobile/Tablets
# ==============================================================================
class_name TouchInputHandler
extends Node

signal single_tap(screen_position: Vector2)
signal pinch_zoom(zoom_factor: float)
signal touch_drag(drag_vector: Vector2)

var _touch_points: Dictionary = {}
var _initial_pinch_distance: float = 0.0
var _is_pinching: bool = false

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			_touch_points[event.index] = event.position
			if _touch_points.size() == 2:
				_is_pinching = true
				var p1 = _touch_points.values()[0]
				var p2 = _touch_points.values()[1]
				_initial_pinch_distance = p1.distance_to(p2)
		else:
			_touch_points.erase(event.index)
			if _touch_points.size() < 2:
				_is_pinching = false
			if _touch_points.is_empty():
				single_tap.emit(event.position)
				
	elif event is InputEventScreenDrag:
		_touch_points[event.index] = event.position
		if _is_pinching and _touch_points.size() >= 2:
			var p1 = _touch_points.values()[0]
			var p2 = _touch_points.values()[1]
			var current_dist = p1.distance_to(p2)
			if _initial_pinch_distance > 0.0:
				var factor = current_dist / _initial_pinch_distance
				pinch_zoom.emit(factor)
				_initial_pinch_distance = current_dist
		else:
			touch_drag.emit(event.relative)
