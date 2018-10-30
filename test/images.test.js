const {Frame} = require('../src/images');

test('Frame requires positive width', function() {
    expect(() => new Frame(-1, 5)).toThrow(Error);
    expect(() => new Frame(0, 5)).toThrow(Error);
});

test('Frame requires positive height', function() {
    expect(() => new Frame(5, -1)).toThrow(Error);
    expect(() => new Frame(5, 0)).toThrow(Error);
});

test('Frame constructs correctly', function() {
    const f = new Frame(3, 5);
    expect(f.data).toHaveLength(15);
    expect(f.width).toBe(3);
    expect(f.height).toBe(5);
});
