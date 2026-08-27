<?php

namespace App\Livewire;

use Livewire\Component;
use Livewire\WithFileUploads;

class UploadDropzone extends Component
{
    use WithFileUploads;

    public $files = [];

    public function updatedFiles()
    {
        $this->validate([
            'files.*' => 'image|max:10240',
        ]);
    }

    public function render()
    {
        return view('livewire.upload-dropzone');
    }
}
