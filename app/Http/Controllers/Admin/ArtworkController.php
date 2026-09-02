<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Artwork;
use App\Models\ArtworkAsset;
use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ArtworkController extends Controller
{
    public function index()
    {
        return view('admin.artworks.index', [
            'artworks' => Artwork::with('collection')->orderByDesc('createdAt')->paginate(20),
        ]);
    }

    public function create()
    {
        return view('admin.artworks.form', [
            'artwork' => new Artwork(['status' => 'DRAFT', 'currency' => 'GBP']),
            'collections' => Collection::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        $artwork = Artwork::create($data);

        $this->handleUploads($request, $artwork);

        return redirect()->route('admin.artworks.edit', $artwork)->with('message', 'Artwork created.');
    }

    public function edit(Artwork $artwork)
    {
        return view('admin.artworks.form', [
            'artwork' => $artwork,
            'collections' => Collection::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Artwork $artwork)
    {
        $artwork->update($this->validated($request, $artwork));

        $this->handleUploads($request, $artwork);

        return redirect()->route('admin.artworks.edit', $artwork)->with('message', 'Artwork updated.');
    }

    public function destroy(Artwork $artwork)
    {
        $artwork->delete();

        return redirect()->route('admin.artworks.index')->with('message', 'Artwork deleted.');
    }

    protected function validated(Request $request, ?Artwork $artwork = null): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'stockOnHand' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', 'in:DRAFT,PUBLISHED,ARCHIVED'],
            'collectionId' => ['nullable', 'exists:Collection,id'],
        ]);

        $slug = ($data['slug'] ?? null) ?: Str::slug($data['title']);
        $original = $slug;
        $i = 1;
        while (Artwork::where('slug', $slug)->when($artwork, fn ($q) => $q->where('id', '!=', $artwork->id))->exists()) {
            $slug = "{$original}-{$i}";
            $i++;
        }

        return [
            'title' => $data['title'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'category' => $data['category'] ?? null,
            'pricePence' => (int) round($data['price'] * 100),
            'currency' => strtoupper($data['currency']),
            'stockOnHand' => $data['stockOnHand'] ?? null,
            'status' => $data['status'],
            'collectionId' => $data['collectionId'] ?? null,
        ];
    }

    protected function handleUploads(Request $request, Artwork $artwork): void
    {
        if ($request->hasFile('preview_image')) {
            $path = $request->file('preview_image')->store('artwork-previews', 'public');
            $artwork->previewUrl = Storage::disk('public')->url($path);
            $artwork->save();
        }

        if ($request->hasFile('download_master')) {
            $file = $request->file('download_master');
            $key = 'artworks/'.$artwork->id.'/download-master.'.$file->getClientOriginalExtension();

            try {
                Storage::disk('r2')->put($key, file_get_contents($file->getRealPath()));
            } catch (\Throwable $e) {
                // r2 not configured in this environment (e.g. local dev) — fall back to local disk.
                Storage::disk('local')->put($key, file_get_contents($file->getRealPath()));
            }

            ArtworkAsset::updateOrCreate(
                ['artworkId' => $artwork->id, 'kind' => 'DOWNLOAD_MASTER'],
                [
                    'storageKey' => $key,
                    'mimeType' => $file->getClientMimeType(),
                    'bytes' => $file->getSize(),
                ]
            );
        }
    }
}
