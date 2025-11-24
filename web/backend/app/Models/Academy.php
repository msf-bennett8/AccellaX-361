<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Academy extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'sport',
        'location',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the users that belong to this academy.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the kids that belong to this academy.
     */
    public function kids()
    {
        return $this->hasMany(Kid::class);
    }

    /**
     * Get the sessions for this academy.
     */
    public function sessions()
    {
        return $this->hasMany(Session::class);
    }

    /**
     * Get the events for this academy.
     */
    public function events()
    {
        return $this->hasMany(Event::class);
    }
}