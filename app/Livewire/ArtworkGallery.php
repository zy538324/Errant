<?php

namespace App\Livewire;

use App\Models\Artwork;
use Livewire\Component;
use Livewire\WithPagination;

class ArtworkGallery extends Component
{
    use WithPagination;

    public $category = '';
    public $search = '';
    public $sortBy = 'newest';

    protected $listeners = ['filters-updated' => 'applyFilters'];

    public function applyFilters($data)
    {
        $this->category = $data['category'] ?? '';
        $this->search = $data['search'] ?? '';
        $this->sortBy = $data['sortBy'] ?? 'newest';
        $this->resetPage();
    }

    public function render()
    {
        $query = Artwork::where('status', 'PUBLISHED')
            ->with('collection', 'assets');

        if ($this->category) {
            $query->where('category', $this->category);
        }

        if ($this->search) {
            $query->where('title', 'like', "%{$this->search}%")
                ->orWhere('description', 'like', "%{$this->search}%");
        }

        $query = match ($this->sortBy) {
            'price_low' => $query->orderBy('pricePence', 'asc'),
            'price_high' => $query->orderBy('pricePence', 'desc'),
            'oldest' => $query->orderBy('createdAt', 'asc'),
            default => $query->orderBy('createdAt', 'desc'),
        };

        $artworks = $query->paginate(12);

        return view('livewire.artwork-gallery', [
            'artworks' => $artworks,
        ]);
    }
}
