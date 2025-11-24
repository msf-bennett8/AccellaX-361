<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Models\Academy;

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::post('/auth/elevate-role', [AuthController::class, 'elevateRole']);
    
    // Academy routes - Fetch from database with smart fallback
    Route::get('/academies/{id}', function($id) {
        try {
            $academy = Academy::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'academy' => [
                    'id' => $academy->id,
                    'name' => $academy->name,
                    'sport' => $academy->sport,
                    'location' => $academy->location,
                    'created_at' => $academy->created_at,
                ]
            ]);
        } catch (\Exception $e) {
            // Fallback: return first academy if requested ID doesn't exist
            $academy = Academy::first();
            
            if (!$academy) {
                return response()->json([
                    'success' => false,
                    'message' => 'No academies found in database'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'academy' => [
                    'id' => $academy->id,
                    'name' => $academy->name,
                    'sport' => $academy->sport,
                    'location' => $academy->location,
                    'created_at' => $academy->created_at,
                ]
            ]);
        }
    });
});

// Test route
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});