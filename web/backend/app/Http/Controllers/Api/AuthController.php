<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth as FirebaseAuth;

class AuthController extends Controller
{
    protected $firebaseAuth;
    protected $projectId = 'accellax-361';

    public function __construct()
    {
        $factory = (new Factory)->withServiceAccount(storage_path('app/firebase-credentials.json'));
        $this->firebaseAuth = $factory->createAuth();
    }

    /**
     * Create Firestore document using REST API
     */
    private function createFirestoreDocument($collection, $documentId, $data)
    {
        try {
            // Get access token from service account
            $credentials = json_decode(file_get_contents(storage_path('app/firebase-credentials.json')), true);
            
            // Create JWT for authentication
            $now = time();
            $payload = [
                'iss' => $credentials['client_email'],
                'sub' => $credentials['client_email'],
                'aud' => 'https://firestore.googleapis.com/',
                'iat' => $now,
                'exp' => $now + 3600,
            ];
            
            // Sign JWT
            $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $payload = base64_encode(json_encode($payload));
            $signature = '';
            openssl_sign(
                "$header.$payload",
                $signature,
                $credentials['private_key'],
                OPENSSL_ALGO_SHA256
            );
            $signature = base64_encode($signature);
            $jwt = "$header.$payload.$signature";
            
            // Convert data to Firestore format
            $firestoreData = ['fields' => $this->convertToFirestoreFormat($data)];
            
            // Make REST API call
            $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/{$collection}/{$documentId}";
            
            $response = Http::withHeaders([
                'Authorization' => "Bearer $jwt",
                'Content-Type' => 'application/json',
            ])->patch($url, $firestoreData);
            
            if ($response->successful()) {
                Log::info("✅ Firestore document created: {$collection}/{$documentId}");
                return true;
            } else {
                Log::error("❌ Firestore REST API failed: " . $response->body());
                return false;
            }
            
        } catch (\Exception $e) {
            Log::error("❌ Firestore document creation failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Convert array to Firestore format
     */
    private function convertToFirestoreFormat($data)
    {
        $formatted = [];
        foreach ($data as $key => $value) {
            if ($value instanceof \DateTime) {
                $formatted[$key] = ['timestampValue' => $value->format('Y-m-d\TH:i:s\Z')];
            } elseif (is_string($value)) {
                $formatted[$key] = ['stringValue' => $value];
            } elseif (is_int($value)) {
                $formatted[$key] = ['integerValue' => (string)$value];
            } elseif (is_bool($value)) {
                $formatted[$key] = ['booleanValue' => $value];
            } else {
                $formatted[$key] = ['stringValue' => (string)$value];
            }
        }
        return $formatted;
    }

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'required|string|min:3|max:30|unique:users|regex:/^[a-zA-Z0-9_]+$/',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:parent,kid,coach,sponsor,payment_recorder',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // 1. Create user in MySQL
            $user = User::create([
                'name' => $request->name,
                'username' => $request->username,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'academy_id' => 1,
            ]);

            // 2. Create user in Firebase Auth
            $firebaseUser = $this->firebaseAuth->createUser([
                'email' => $request->email,
                'password' => $request->password,
                'displayName' => $request->name,
                'emailVerified' => false,
            ]);

            // 3. Create Firestore document via REST API
            $this->createFirestoreDocument('users', $firebaseUser->uid, [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'role' => $user->role,
                'academy_id' => $user->academy_id,
                'firebase_uid' => $firebaseUser->uid,
                'email_verified' => false,
                'created_at' => new \DateTime(),
                'updated_at' => new \DateTime(),
            ]);

            // 4. Create custom token
            $firebaseCustomToken = $this->firebaseAuth->createCustomToken($firebaseUser->uid, [
                'role' => $user->role,
                'userId' => $user->id,
            ]);

            // 5. Create Sanctum token
            $sanctumToken = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                ],
                'token' => $sanctumToken,
                'firebase_token' => $firebaseCustomToken->toString(),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identifier' => 'required|string', // Can be email, username, or phone
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Support login with email, username, or phone
            $identifier = $request->identifier;
            $user = User::where('email', $identifier)
                ->orWhere('username', $identifier)
                ->orWhere('phone', $identifier)
                ->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Get Firebase user by email (Firebase only supports email lookup)
            $firebaseUser = $this->firebaseAuth->getUserByEmail($user->email);

            // Sync Firestore document
            // Sync Firestore document
            $this->createFirestoreDocument('users', $firebaseUser->uid, [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'role' => $user->role,
                'academy_id' => $user->academy_id,
                'firebase_uid' => $firebaseUser->uid,
                'updated_at' => new \DateTime(),
            ]);

            $firebaseCustomToken = $this->firebaseAuth->createCustomToken($firebaseUser->uid, [
                'role' => $user->role,
                'userId' => $user->id,
            ]);

            $sanctumToken = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                ],
                'token' => $sanctumToken,
                'firebase_token' => $firebaseCustomToken->toString(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Logged out successfully'], 200);
    }

    public function profile(Request $request)
    {
        return response()->json(['success' => true, 'user' => $request->user()], 200);
    }


    /**
     * Elevate user role (Admin or Super Admin)
     */
    public function elevateRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'secretCode' => 'required|string',
            'password' => 'required|string',
            'targetRole' => 'required|in:admin,super_admin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();
            $targetRole = $request->targetRole;
            $providedPassword = $request->password;

            // Get the correct elevation secret from .env
            $correctSecret = $targetRole === 'super_admin' 
                ? env('SUPER_ADMIN_ELEVATION_SECRET')
                : env('ADMIN_ELEVATION_SECRET');

            // Verify password
            if ($providedPassword !== $correctSecret) {
                Log::warning("Failed elevation attempt for user {$user->id} to {$targetRole}");
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid elevation password'
                ], 403);
            }

            // Prevent downgrading super_admin
            if ($user->role === 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Super admin cannot be downgraded'
                ], 403);
            }

            // Update user role
            $oldRole = $user->role;
            $user->role = $targetRole;
            $user->elevation_secret = Hash::make($providedPassword); // Store hashed for audit
            $user->save();

            // Sync to Firestore
            try {
                $firebaseUser = $this->firebaseAuth->getUserByEmail($user->email);
                $this->createFirestoreDocument('users', $firebaseUser->uid, [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone' => $user->phone ?? '',
                    'role' => $user->role,
                    'academy_id' => $user->academy_id,
                    'firebase_uid' => $firebaseUser->uid,
                    'updated_at' => new \DateTime(),
                ]);
            } catch (\Exception $e) {
                Log::warning("Firestore sync failed during elevation: " . $e->getMessage());
            }

            Log::info("✅ User {$user->id} elevated from {$oldRole} to {$targetRole}");

            // Generate new Sanctum token with elevated role
            $newToken = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => "Role elevated to {$targetRole} successfully",
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'token' => $newToken,
            ], 200);

        } catch (\Exception $e) {
            Log::error("Elevation error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Role elevation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}