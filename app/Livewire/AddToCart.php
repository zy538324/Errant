<?php

namespace App\Livewire;

use Livewire\Component;

class AddToCart extends Component
{
    public $artworkId;
    public $kind = 'digital';
    public $printSku = null;
    public $quantity = 1;

    public function addToCart()
    {
        $this->dispatch('cart-updated');
    }

    public function render()
    {
        return view('livewire.add-to-cart');
    }
}
