<?php

namespace App\Livewire;

use App\Support\Cart;
use Livewire\Component;

class AddToCart extends Component
{
    public string $artworkId;
    public string $kind = 'digital';
    public ?string $printSku = null;
    public int $quantity = 1;

    public function addToCart()
    {
        Cart::add($this->artworkId, $this->kind, $this->printSku, $this->quantity);

        $this->dispatch('cart-updated', count: Cart::count());

        session()->flash('message', 'Added to cart.');
    }

    public function render()
    {
        return view('livewire.add-to-cart');
    }
}
