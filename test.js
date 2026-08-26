async function run() {
    const slug = "my-slug";
    let suffix = 1;
    let newSlug = slug;
    while (suffix < 10) {
        if (suffix > 5) break;
        newSlug = `${slug}-${suffix}`;
        suffix++;
    }
    console.log(newSlug);
}
run();
