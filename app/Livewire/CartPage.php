<?php

namespace App\Livewire;

use App\Support\Cart;
use Livewire\Component;

class CartPage extends Component
{
    public function updateQuantity(string $key, int $quantity)
    {
        Cart::updateQuantity($key, $quantity);
    }

    public function remove(string $key)
    {
        Cart::remove($key);
    }

    public function render()
    {
        return view('livewire.cart-page', [
            'lines' => Cart::lines(),
            'totalPence' => Cart::totalPence(),
        ]);
    }
}
