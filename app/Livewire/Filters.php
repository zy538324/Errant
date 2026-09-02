<?php

namespace App\Livewire;

use App\Models\Artwork;
use Livewire\Component;

class Filters extends Component
{
    public $category = '';
    public $search = '';
    public $sortBy = 'newest';

    public function updatedCategory()
    {
        $this->dispatchFiltersUpdated();
    }

    public function updatedSearch()
    {
        $this->dispatchFiltersUpdated();
    }

    public function updatedSortBy()
    {
        $this->dispatchFiltersUpdated();
    }

    private function dispatchFiltersUpdated()
    {
        $this->dispatch('filters-updated', [
            'category' => $this->category,
            'search' => $this->search,
            'sortBy' => $this->sortBy,
        ]);
    }

    public function render()
    {
        $categories = Artwork::where('status', 'PUBLISHED')
            ->distinct()
            ->pluck('category')
            ->filter()
            ->sort();

        return view('livewire.filters', [
            'categories' => $categories,
        ]);
    }
}
