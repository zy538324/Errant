<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CollectionController extends Controller
{
    public function index()
    {
        return view('admin.collections.index', [
            'collections' => Collection::withCount('artworks')->orderBy('sortOrder')->get(),
        ]);
    }

    public function create()
    {
        return view('admin.collections.form', ['collection' => new Collection()]);
    }

    public function store(Request $request)
    {
        Collection::create($this->validated($request));

        return redirect()->route('admin.collections.index')->with('message', 'Collection created.');
    }

    public function edit(Collection $collection)
    {
        return view('admin.collections.form', ['collection' => $collection]);
    }

    public function update(Request $request, Collection $collection)
    {
        $collection->update($this->validated($request, $collection));

        return redirect()->route('admin.collections.index')->with('message', 'Collection updated.');
    }

    public function destroy(Collection $collection)
    {
        $collection->delete();

        return redirect()->route('admin.collections.index')->with('message', 'Collection deleted.');
    }

    protected function validated(Request $request, ?Collection $collection = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sortOrder' => ['nullable', 'integer'],
        ]);

        $slug = ($data['slug'] ?? null) ?: Str::slug($data['name']);
        $original = $slug;
        $i = 1;
        while (Collection::where('slug', $slug)->when($collection, fn ($q) => $q->where('id', '!=', $collection->id))->exists()) {
            $slug = "{$original}-{$i}";
            $i++;
        }

        return [
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'sortOrder' => $data['sortOrder'] ?? 0,
        ];
    }
}
