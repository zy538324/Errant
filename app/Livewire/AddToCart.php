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
        // TODO: Implement cart functionality
        // This would typically:
        // 1. Add to session cart or database
        // 2. Dispatch event to update cart count
        // 3. Show success message
        
        $this->dispatch('cart-updated', [
            'artworkId' => $this->artworkId,
            'quantity' => $this->quantity,
            'kind' => $this->kind,
        ]);

        session()->flash('message', 'Added to cart!');
    }

    public function render()
    {
        return view('livewire.add-to-cart');
    }
}
