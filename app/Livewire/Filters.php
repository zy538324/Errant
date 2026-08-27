<?php

namespace App\Livewire;

use Livewire\Component;

class Filters extends Component
{
    public $category = '';
    public $search = '';
    public $sortBy = 'newest';

    public function updatedFilters()
    {
        $this->dispatch('filters-updated', [
            'category' => $this->category,
            'search' => $this->search,
            'sortBy' => $this->sortBy,
        ]);
    }

    public function render()
    {
        return view('livewire.filters');
    }
}
