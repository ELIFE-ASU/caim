// Copyright 2018. Douglas G. Moore. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
const {Session} = require('../src/session');

test('new session', function() {
    expect(Session).toThrow();
    expect(() => Session('')).toThrow();
    expect(Session('path').path).toBe('path');
});
