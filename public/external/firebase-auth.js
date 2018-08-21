! function (t, e) {
    "use strict";
    try {
        e = e && e.hasOwnProperty("default") ? e.default : e,
            function () {
                var t, n = n || {},
                    i = this;

                function r(t) {
                    return "string" == typeof t
                }

                function o(t) {
                    return "boolean" == typeof t
                }

                function a() {}

                function s(t) {
                    var e = typeof t;
                    if ("object" == e) {
                        if (!t) return "null";
                        if (t instanceof Array) return "array";
                        if (t instanceof Object) return e;
                        var n = Object.prototype.toString.call(t);
                        if ("[object Window]" == n) return "object";
                        if ("[object Array]" == n || "number" == typeof t.length && void 0 !== t.splice && void 0 !== t.propertyIsEnumerable && !t.propertyIsEnumerable("splice")) return "array";
                        if ("[object Function]" == n || void 0 !== t.call && void 0 !== t.propertyIsEnumerable && !t.propertyIsEnumerable("call")) return "function"
                    } else if ("function" == e && void 0 === t.call) return "object";
                    return e
                }

                function u(t) {
                    return null === t
                }

                function c(t) {
                    return "array" == s(t)
                }

                function h(t) {
                    var e = s(t);
                    return "array" == e || "object" == e && "number" == typeof t.length
                }

                function f(t) {
                    return "function" == s(t)
                }

                function l(t) {
                    var e = typeof t;
                    return "object" == e && null != t || "function" == e
                }
                var d = "closure_uid_" + (1e9 * Math.random() >>> 0),
                    p = 0;

                function v(t, e, n) {
                    return t.call.apply(t.bind, arguments)
                }

                function m(t, e, n) {
                    if (!t) throw Error();
                    if (2 < arguments.length) {
                        var i = Array.prototype.slice.call(arguments, 2);
                        return function () {
                            var n = Array.prototype.slice.call(arguments);
                            return Array.prototype.unshift.apply(n, i), t.apply(e, n)
                        }
                    }
                    return function () {
                        return t.apply(e, arguments)
                    }
                }

                function g(t, e, n) {
                    return (g = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? v : m).apply(null, arguments)
                }

                function b(t, e) {
                    var n = Array.prototype.slice.call(arguments, 1);
                    return function () {
                        var e = n.slice();
                        return e.push.apply(e, arguments), t.apply(this, e)
                    }
                }
                var y = Date.now || function () {
                    return +new Date
                };

                function w(t, e) {
                    function n() {}
                    n.prototype = e.prototype, t.lb = e.prototype, t.prototype = new n, t.prototype.constructor = t, t.cd = function (t, n, i) {
                        for (var r = Array(arguments.length - 2), o = 2; o < arguments.length; o++) r[o - 2] = arguments[o];
                        return e.prototype[n].apply(t, r)
                    }
                }

                function I(t) {
                    t.prototype.then = t.prototype.then, t.prototype.$goog_Thenable = !0
                }

                function T(t) {
                    if (!t) return !1;
                    try {
                        return !!t.$goog_Thenable
                    } catch (t) {
                        return !1
                    }
                }

                function A(t) {
                    if (Error.captureStackTrace) Error.captureStackTrace(this, A);
                    else {
                        var e = Error().stack;
                        e && (this.stack = e)
                    }
                    t && (this.message = String(t))
                }

                function E(t, e) {
                    for (var n = "", i = (t = t.split("%s")).length - 1, r = 0; r < i; r++) n += t[r] + (r < e.length ? e[r] : "%s");
                    A.call(this, n + t[i])
                }

                function S(t, e) {
                    throw new E("Failure" + (t ? ": " + t : ""), Array.prototype.slice.call(arguments, 1))
                }

                function k(t, e) {
                    this.c = t, this.f = e, this.b = 0, this.a = null
                }

                function N(t, e) {
                    t.f(e), 100 > t.b && (t.b++, e.next = t.a, t.a = e)
                }

                function _() {
                    this.b = this.a = null
                }
                w(A, Error), A.prototype.name = "CustomError", w(E, A), E.prototype.name = "AssertionError", k.prototype.get = function () {
                    if (0 < this.b) {
                        this.b--;
                        var t = this.a;
                        this.a = t.next, t.next = null
                    } else t = this.c();
                    return t
                };
                var O = new k(function () {
                    return new R
                }, function (t) {
                    t.reset()
                });

                function P() {
                    var t = dt,
                        e = null;
                    return t.a && (e = t.a, t.a = t.a.next, t.a || (t.b = null), e.next = null), e
                }

                function R() {
                    this.next = this.b = this.a = null
                }
                _.prototype.add = function (t, e) {
                    var n = O.get();
                    n.set(t, e), this.b ? this.b.next = n : this.a = n, this.b = n
                }, R.prototype.set = function (t, e) {
                    this.a = t, this.b = e, this.next = null
                }, R.prototype.reset = function () {
                    this.next = this.b = this.a = null
                };
                var C = Array.prototype.indexOf ? function (t, e) {
                        return Array.prototype.indexOf.call(t, e, void 0)
                    } : function (t, e) {
                        if (r(t)) return r(e) && 1 == e.length ? t.indexOf(e, 0) : -1;
                        for (var n = 0; n < t.length; n++)
                            if (n in t && t[n] === e) return n;
                        return -1
                    },
                    D = Array.prototype.forEach ? function (t, e, n) {
                        Array.prototype.forEach.call(t, e, n)
                    } : function (t, e, n) {
                        for (var i = t.length, o = r(t) ? t.split("") : t, a = 0; a < i; a++) a in o && e.call(n, o[a], a, t)
                    };
                var L = Array.prototype.map ? function (t, e) {
                        return Array.prototype.map.call(t, e, void 0)
                    } : function (t, e) {
                        for (var n = t.length, i = Array(n), o = r(t) ? t.split("") : t, a = 0; a < n; a++) a in o && (i[a] = e.call(void 0, o[a], a, t));
                        return i
                    },
                    x = Array.prototype.some ? function (t, e) {
                        return Array.prototype.some.call(t, e, void 0)
                    } : function (t, e) {
                        for (var n = t.length, i = r(t) ? t.split("") : t, o = 0; o < n; o++)
                            if (o in i && e.call(void 0, i[o], o, t)) return !0;
                        return !1
                    };

                function M(t, e) {
                    return 0 <= C(t, e)
                }

                function j(t, e) {
                    var n;
                    return (n = 0 <= (e = C(t, e))) && Array.prototype.splice.call(t, e, 1), n
                }

                function U(t, e) {
                    ! function (t, e) {
                        var n = t.length,
                            i = r(t) ? t.split("") : t;
                        for (--n; 0 <= n; --n) n in i && e.call(void 0, i[n], n, t)
                    }(t, function (n, i) {
                        e.call(void 0, n, i, t) && 1 == Array.prototype.splice.call(t, i, 1).length && 0
                    })
                }

                function V(t) {
                    return Array.prototype.concat.apply([], arguments)
                }

                function F(t) {
                    var e = t.length;
                    if (0 < e) {
                        for (var n = Array(e), i = 0; i < e; i++) n[i] = t[i];
                        return n
                    }
                    return []
                }

                function K(t, e) {
                    for (var n = t.split("%s"), i = "", r = Array.prototype.slice.call(arguments, 1); r.length && 1 < n.length;) i += n.shift() + r.shift();
                    return i + n.join("%s")
                }
                var H = String.prototype.trim ? function (t) {
                    return t.trim()
                } : function (t) {
                    return /^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(t)[1]
                };

                function q(t) {
                    return $.test(t) ? (-1 != t.indexOf("&") && (t = t.replace(G, "&amp;")), -1 != t.indexOf("<") && (t = t.replace(B, "&lt;")), -1 != t.indexOf(">") && (t = t.replace(X, "&gt;")), -1 != t.indexOf('"') && (t = t.replace(z, "&quot;")), -1 != t.indexOf("'") && (t = t.replace(J, "&#39;")), -1 != t.indexOf("\0") && (t = t.replace(Y, "&#0;")), t) : t
                }
                var W, G = /&/g,
                    B = /</g,
                    X = />/g,
                    z = /"/g,
                    J = /'/g,
                    Y = /\x00/g,
                    $ = /[\x00&<>"']/;

                function Z(t, e) {
                    return -1 != t.indexOf(e)
                }

                function Q(t, e) {
                    return t < e ? -1 : t > e ? 1 : 0
                }
                t: {
                    var tt = i.navigator;
                    if (tt) {
                        var et = tt.userAgent;
                        if (et) {
                            W = et;
                            break t
                        }
                    }
                    W = ""
                }

                function nt(t) {
                    return Z(W, t)
                }

                function it(t, e) {
                    for (var n in t) e.call(void 0, t[n], n, t)
                }

                function rt(t) {
                    for (var e in t) return !1;
                    return !0
                }

                function ot(t) {
                    var e, n = {};
                    for (e in t) n[e] = t[e];
                    return n
                }
                var at, st, ut = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");

                function ct(t, e) {
                    for (var n, i, r = 1; r < arguments.length; r++) {
                        for (n in i = arguments[r]) t[n] = i[n];
                        for (var o = 0; o < ut.length; o++) n = ut[o], Object.prototype.hasOwnProperty.call(i, n) && (t[n] = i[n])
                    }
                }

                function ht(t) {
                    i.setTimeout(function () {
                        throw t
                    }, 0)
                }

                function ft(t, e) {
                    st || function () {
                        if (i.Promise && i.Promise.resolve) {
                            var t = i.Promise.resolve(void 0);
                            st = function () {
                                t.then(pt)
                            }
                        } else st = function () {
                            var t = pt;
                            !f(i.setImmediate) || i.Window && i.Window.prototype && !nt("Edge") && i.Window.prototype.setImmediate == i.setImmediate ? (at || (at = function () {
                                var t = i.MessageChannel;
                                if (void 0 === t && "undefined" != typeof window && window.postMessage && window.addEventListener && !nt("Presto") && (t = function () {
                                        var t = document.createElement("IFRAME");
                                        t.style.display = "none", t.src = "", document.documentElement.appendChild(t);
                                        var e = t.contentWindow;
                                        (t = e.document).open(), t.write(""), t.close();
                                        var n = "callImmediate" + Math.random(),
                                            i = "file:" == e.location.protocol ? "*" : e.location.protocol + "//" + e.location.host;
                                        t = g(function (t) {
                                            "*" != i && t.origin != i || t.data != n || this.port1.onmessage()
                                        }, this), e.addEventListener("message", t, !1), this.port1 = {}, this.port2 = {
                                            postMessage: function () {
                                                e.postMessage(n, i)
                                            }
                                        }
                                    }), void 0 !== t && !nt("Trident") && !nt("MSIE")) {
                                    var e = new t,
                                        n = {},
                                        r = n;
                                    return e.port1.onmessage = function () {
                                            if (void 0 !== n.next) {
                                                var t = (n = n.next).tb;
                                                n.tb = null, t()
                                            }
                                        },
                                        function (t) {
                                            r.next = {
                                                tb: t
                                            }, r = r.next, e.port2.postMessage(0)
                                        }
                                }
                                return "undefined" != typeof document && "onreadystatechange" in document.createElement("SCRIPT") ? function (t) {
                                    var e = document.createElement("SCRIPT");
                                    e.onreadystatechange = function () {
                                        e.onreadystatechange = null, e.parentNode.removeChild(e), e = null, t(), t = null
                                    }, document.documentElement.appendChild(e)
                                } : function (t) {
                                    i.setTimeout(t, 0)
                                }
                            }()), at(t)) : i.setImmediate(t)
                        }
                    }(), lt || (st(), lt = !0), dt.add(t, e)
                }
                var lt = !1,
                    dt = new _;

                function pt() {
                    for (var t; t = P();) {
                        try {
                            t.a.call(t.b)
                        } catch (t) {
                            ht(t)
                        }
                        N(O, t)
                    }
                    lt = !1
                }

                function vt(t, e) {
                    if (this.a = mt, this.i = void 0, this.f = this.b = this.c = null, this.g = this.h = !1, t != a) try {
                        var n = this;
                        t.call(e, function (t) {
                            Nt(n, gt, t)
                        }, function (t) {
                            if (!(t instanceof Lt)) try {
                                if (t instanceof Error) throw t;
                                throw Error("Promise rejected.")
                            } catch (t) {}
                            Nt(n, bt, t)
                        })
                    } catch (t) {
                        Nt(this, bt, t)
                    }
                }
                var mt = 0,
                    gt = 2,
                    bt = 3;

                function yt() {
                    this.next = this.f = this.b = this.g = this.a = null, this.c = !1
                }
                yt.prototype.reset = function () {
                    this.f = this.b = this.g = this.a = null, this.c = !1
                };
                var wt = new k(function () {
                    return new yt
                }, function (t) {
                    t.reset()
                });

                function It(t, e, n) {
                    var i = wt.get();
                    return i.g = t, i.b = e, i.f = n, i
                }

                function Tt(t) {
                    if (t instanceof vt) return t;
                    var e = new vt(a);
                    return Nt(e, gt, t), e
                }

                function At(t) {
                    return new vt(function (e, n) {
                        n(t)
                    })
                }

                function Et(t, e, n) {
                    _t(t, e, n, null) || ft(b(e, t))
                }

                function St(t, e) {
                    t.b || t.a != gt && t.a != bt || Ot(t), t.f ? t.f.next = e : t.b = e, t.f = e
                }

                function kt(t, e, n, i) {
                    var r = It(null, null, null);
                    return r.a = new vt(function (t, o) {
                        r.g = e ? function (n) {
                            try {
                                var r = e.call(i, n);
                                t(r)
                            } catch (t) {
                                o(t)
                            }
                        } : t, r.b = n ? function (e) {
                            try {
                                var r = n.call(i, e);
                                void 0 === r && e instanceof Lt ? o(e) : t(r)
                            } catch (t) {
                                o(t)
                            }
                        } : o
                    }), r.a.c = t, St(t, r), r.a
                }

                function Nt(t, e, n) {
                    t.a == mt && (t === n && (e = bt, n = new TypeError("Promise cannot resolve to itself")), t.a = 1, _t(n, t.Lc, t.Mc, t) || (t.i = n, t.a = e, t.c = null, Ot(t), e != bt || n instanceof Lt || function (t, e) {
                        t.g = !0, ft(function () {
                            t.g && Dt.call(null, e)
                        })
                    }(t, n)))
                }

                function _t(t, e, n, i) {
                    if (t instanceof vt) return St(t, It(e || a, n || null, i)), !0;
                    if (T(t)) return t.then(e, n, i), !0;
                    if (l(t)) try {
                        var r = t.then;
                        if (f(r)) return function (t, e, n, i, r) {
                            function o(t) {
                                a || (a = !0, i.call(r, t))
                            }
                            var a = !1;
                            try {
                                e.call(t, function (t) {
                                    a || (a = !0, n.call(r, t))
                                }, o)
                            } catch (t) {
                                o(t)
                            }
                        }(t, r, e, n, i), !0
                    } catch (t) {
                        return n.call(i, t), !0
                    }
                    return !1
                }

                function Ot(t) {
                    t.h || (t.h = !0, ft(t.Ub, t))
                }

                function Pt(t) {
                    var e = null;
                    return t.b && (e = t.b, t.b = e.next, e.next = null), t.b || (t.f = null), e
                }

                function Rt(t, e, n, i) {
                    if (n == bt && e.b && !e.c)
                        for (; t && t.g; t = t.c) t.g = !1;
                    if (e.a) e.a.c = null, Ct(e, n, i);
                    else try {
                        e.c ? e.g.call(e.f) : Ct(e, n, i)
                    } catch (t) {
                        Dt.call(null, t)
                    }
                    N(wt, e)
                }

                function Ct(t, e, n) {
                    e == gt ? t.g.call(t.f, n) : t.b && t.b.call(t.f, n)
                }
                vt.prototype.then = function (t, e, n) {
                    return kt(this, f(t) ? t : null, f(e) ? e : null, n)
                }, I(vt), (t = vt.prototype).ia = function (t, e) {
                    return (t = It(t, t, e)).c = !0, St(this, t), this
                }, t.s = function (t, e) {
                    return kt(this, null, t, e)
                }, t.cancel = function (t) {
                    this.a == mt && ft(function () {
                        ! function t(e, n) {
                            if (e.a == mt)
                                if (e.c) {
                                    var i = e.c;
                                    if (i.b) {
                                        for (var r = 0, o = null, a = null, s = i.b; s && (s.c || (r++, s.a == e && (o = s), !(o && 1 < r))); s = s.next) o || (a = s);
                                        o && (i.a == mt && 1 == r ? t(i, n) : (a ? ((r = a).next == i.f && (i.f = r), r.next = r.next.next) : Pt(i), Rt(i, o, bt, n)))
                                    }
                                    e.c = null
                                } else Nt(e, bt, n)
                        }(this, new Lt(t))
                    }, this)
                }, t.Lc = function (t) {
                    this.a = mt, Nt(this, gt, t)
                }, t.Mc = function (t) {
                    this.a = mt, Nt(this, bt, t)
                }, t.Ub = function () {
                    for (var t; t = Pt(this);) Rt(this, t, this.a, this.i);
                    this.h = !1
                };
                var Dt = ht;

                function Lt(t) {
                    A.call(this, t)
                }

                function xt() {
                    0 != Mt && (jt[this[d] || (this[d] = ++p)] = this), this.pa = this.pa, this.ja = this.ja
                }
                w(Lt, A), Lt.prototype.name = "cancel";
                var Mt = 0,
                    jt = {};

                function Ut(t) {
                    if (!t.pa && (t.pa = !0, t.ua(), 0 != Mt)) {
                        var e = t[d] || (t[d] = ++p);
                        if (0 != Mt && t.ja && 0 < t.ja.length) throw Error(t + " did not empty its onDisposeCallbacks queue. This probably means it overrode dispose() or disposeInternal() without calling the superclass' method.");
                        delete jt[e]
                    }
                }

                function Vt(t) {
                    return Vt[" "](t), t
                }
                xt.prototype.pa = !1, xt.prototype.ua = function () {
                    if (this.ja)
                        for (; this.ja.length;) this.ja.shift()()
                }, Vt[" "] = a;
                var Ft, Kt, Ht = nt("Opera"),
                    qt = nt("Trident") || nt("MSIE"),
                    Wt = nt("Edge"),
                    Gt = Wt || qt,
                    Bt = nt("Gecko") && !(Z(W.toLowerCase(), "webkit") && !nt("Edge")) && !(nt("Trident") || nt("MSIE")) && !nt("Edge"),
                    Xt = Z(W.toLowerCase(), "webkit") && !nt("Edge");

                function zt() {
                    var t = i.document;
                    return t ? t.documentMode : void 0
                }
                t: {
                    var Jt = "",
                        Yt = (Kt = W, Bt ? /rv:([^\);]+)(\)|;)/.exec(Kt) : Wt ? /Edge\/([\d\.]+)/.exec(Kt) : qt ? /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(Kt) : Xt ? /WebKit\/(\S+)/.exec(Kt) : Ht ? /(?:Version)[ \/]?(\S+)/.exec(Kt) : void 0);
                    if (Yt && (Jt = Yt ? Yt[1] : ""), qt) {
                        var $t = zt();
                        if (null != $t && $t > parseFloat(Jt)) {
                            Ft = String($t);
                            break t
                        }
                    }
                    Ft = Jt
                }
                var Zt, Qt = {};

                function te(t) {
                    return function (t, e) {
                        var n = Qt;
                        return Object.prototype.hasOwnProperty.call(n, t) ? n[t] : n[t] = e(t)
                    }(t, function () {
                        for (var e = 0, n = H(String(Ft)).split("."), i = H(String(t)).split("."), r = Math.max(n.length, i.length), o = 0; 0 == e && o < r; o++) {
                            var a = n[o] || "",
                                s = i[o] || "";
                            do {
                                if (a = /(\d*)(\D*)(.*)/.exec(a) || ["", "", "", ""], s = /(\d*)(\D*)(.*)/.exec(s) || ["", "", "", ""], 0 == a[0].length && 0 == s[0].length) break;
                                e = Q(0 == a[1].length ? 0 : parseInt(a[1], 10), 0 == s[1].length ? 0 : parseInt(s[1], 10)) || Q(0 == a[2].length, 0 == s[2].length) || Q(a[2], s[2]), a = a[3], s = s[3]
                            } while (0 == e)
                        }
                        return 0 <= e
                    })
                }
                var ee = i.document;
                Zt = ee && qt ? zt() || ("CSS1Compat" == ee.compatMode ? parseInt(Ft, 10) : 5) : void 0;
                var ne = Object.freeze || function (t) {
                        return t
                    },
                    ie = !qt || 9 <= Number(Zt),
                    re = qt && !te("9"),
                    oe = function () {
                        if (!i.addEventListener || !Object.defineProperty) return !1;
                        var t = !1,
                            e = Object.defineProperty({}, "passive", {
                                get: function () {
                                    t = !0
                                }
                            });
                        return i.addEventListener("test", a, e), i.removeEventListener("test", a, e), t
                    }();

                function ae(t, e) {
                    this.type = t, this.b = this.target = e, this.Gb = !0
                }

                function se(t, e) {
                    if (ae.call(this, t ? t.type : ""), this.relatedTarget = this.b = this.target = null, this.button = this.screenY = this.screenX = this.clientY = this.clientX = 0, this.key = "", this.metaKey = this.shiftKey = this.altKey = this.ctrlKey = !1, this.pointerId = 0, this.pointerType = "", this.a = null, t) {
                        var n = this.type = t.type,
                            i = t.changedTouches ? t.changedTouches[0] : null;
                        if (this.target = t.target || t.srcElement, this.b = e, e = t.relatedTarget) {
                            if (Bt) {
                                t: {
                                    try {
                                        Vt(e.nodeName);
                                        var o = !0;
                                        break t
                                    } catch (t) {}
                                    o = !1
                                }
                                o || (e = null)
                            }
                        } else "mouseover" == n ? e = t.fromElement : "mouseout" == n && (e = t.toElement);
                        this.relatedTarget = e, null === i ? (this.clientX = void 0 !== t.clientX ? t.clientX : t.pageX, this.clientY = void 0 !== t.clientY ? t.clientY : t.pageY, this.screenX = t.screenX || 0, this.screenY = t.screenY || 0) : (this.clientX = void 0 !== i.clientX ? i.clientX : i.pageX, this.clientY = void 0 !== i.clientY ? i.clientY : i.pageY, this.screenX = i.screenX || 0, this.screenY = i.screenY || 0), this.button = t.button, this.key = t.key || "", this.ctrlKey = t.ctrlKey, this.altKey = t.altKey, this.shiftKey = t.shiftKey, this.metaKey = t.metaKey, this.pointerId = t.pointerId || 0, this.pointerType = r(t.pointerType) ? t.pointerType : ue[t.pointerType] || "", this.a = t, t.defaultPrevented && this.preventDefault()
                    }
                }
                ae.prototype.preventDefault = function () {
                    this.Gb = !1
                }, w(se, ae);
                var ue = ne({
                    2: "touch",
                    3: "pen",
                    4: "mouse"
                });
                se.prototype.preventDefault = function () {
                    se.lb.preventDefault.call(this);
                    var t = this.a;
                    if (t.preventDefault) t.preventDefault();
                    else if (t.returnValue = !1, re) try {
                        (t.ctrlKey || 112 <= t.keyCode && 123 >= t.keyCode) && (t.keyCode = -1)
                    } catch (t) {}
                }, se.prototype.f = function () {
                    return this.a
                };
                var ce = "closure_listenable_" + (1e6 * Math.random() | 0),
                    he = 0;

                function fe(t) {
                    t.na = !0, t.listener = null, t.proxy = null, t.src = null, t.La = null
                }

                function le(t) {
                    this.src = t, this.a = {}, this.b = 0
                }

                function de(t, e) {
                    var n = e.type;
                    n in t.a && j(t.a[n], e) && (fe(e), 0 == t.a[n].length && (delete t.a[n], t.b--))
                }

                function pe(t, e, n, i) {
                    for (var r = 0; r < t.length; ++r) {
                        var o = t[r];
                        if (!o.na && o.listener == e && o.capture == !!n && o.La == i) return r
                    }
                    return -1
                }
                le.prototype.add = function (t, e, n, i, r) {
                    var o = t.toString();
                    (t = this.a[o]) || (t = this.a[o] = [], this.b++);
                    var a = pe(t, e, i, r);
                    return -1 < a ? (e = t[a], n || (e.Ia = !1)) : ((e = new function (t, e, n, i, r) {
                        this.listener = t, this.proxy = null, this.src = e, this.type = n, this.capture = !!i, this.La = r, this.key = ++he, this.na = this.Ia = !1
                    }(e, this.src, o, !!i, r)).Ia = n, t.push(e)), e
                };
                var ve = "closure_lm_" + (1e6 * Math.random() | 0),
                    me = {};

                function ge(t, e, n, i, r) {
                    if (i && i.once) ye(t, e, n, i, r);
                    else if (c(e))
                        for (var o = 0; o < e.length; o++) ge(t, e[o], n, i, r);
                    else n = _e(n), t && t[ce] ? Pe(t, e, n, l(i) ? !!i.capture : !!i, r) : be(t, e, n, !1, i, r)
                }

                function be(t, e, n, i, r, o) {
                    if (!e) throw Error("Invalid event type");
                    var a = l(r) ? !!r.capture : !!r,
                        s = ke(t);
                    if (s || (t[ve] = s = new le(t)), !(n = s.add(e, n, i, a, o)).proxy)
                        if (i = function () {
                                var t = Se,
                                    e = ie ? function (n) {
                                        return t.call(e.src, e.listener, n)
                                    } : function (n) {
                                        if (!(n = t.call(e.src, e.listener, n))) return n
                                    };
                                return e
                            }(), n.proxy = i, i.src = t, i.listener = n, t.addEventListener) oe || (r = a), void 0 === r && (r = !1), t.addEventListener(e.toString(), i, r);
                        else if (t.attachEvent) t.attachEvent(Te(e.toString()), i);
                    else {
                        if (!t.addListener || !t.removeListener) throw Error("addEventListener and attachEvent are unavailable.");
                        t.addListener(i)
                    }
                }

                function ye(t, e, n, i, r) {
                    if (c(e))
                        for (var o = 0; o < e.length; o++) ye(t, e[o], n, i, r);
                    else n = _e(n), t && t[ce] ? Re(t, e, n, l(i) ? !!i.capture : !!i, r) : be(t, e, n, !0, i, r)
                }

                function we(t, e, n, i, r) {
                    if (c(e))
                        for (var o = 0; o < e.length; o++) we(t, e[o], n, i, r);
                    else i = l(i) ? !!i.capture : !!i, n = _e(n), t && t[ce] ? (t = t.m, (e = String(e).toString()) in t.a && (-1 < (n = pe(o = t.a[e], n, i, r)) && (fe(o[n]), Array.prototype.splice.call(o, n, 1), 0 == o.length && (delete t.a[e], t.b--)))) : t && (t = ke(t)) && (e = t.a[e.toString()], t = -1, e && (t = pe(e, n, i, r)), (n = -1 < t ? e[t] : null) && Ie(n))
                }

                function Ie(t) {
                    if ("number" != typeof t && t && !t.na) {
                        var e = t.src;
                        if (e && e[ce]) de(e.m, t);
                        else {
                            var n = t.type,
                                i = t.proxy;
                            e.removeEventListener ? e.removeEventListener(n, i, t.capture) : e.detachEvent ? e.detachEvent(Te(n), i) : e.addListener && e.removeListener && e.removeListener(i), (n = ke(e)) ? (de(n, t), 0 == n.b && (n.src = null, e[ve] = null)) : fe(t)
                        }
                    }
                }

                function Te(t) {
                    return t in me ? me[t] : me[t] = "on" + t
                }

                function Ae(t, e, n, i) {
                    var r = !0;
                    if ((t = ke(t)) && (e = t.a[e.toString()]))
                        for (e = e.concat(), t = 0; t < e.length; t++) {
                            var o = e[t];
                            o && o.capture == n && !o.na && (o = Ee(o, i), r = r && !1 !== o)
                        }
                    return r
                }

                function Ee(t, e) {
                    var n = t.listener,
                        i = t.La || t.src;
                    return t.Ia && Ie(t), n.call(i, e)
                }

                function Se(t, e) {
                    if (t.na) return !0;
                    if (!ie) {
                        if (!e) t: {
                            e = ["window", "event"];
                            for (var n = i, r = 0; r < e.length; r++)
                                if (null == (n = n[e[r]])) {
                                    e = null;
                                    break t
                                }
                            e = n
                        }
                        if (e = new se(r = e, this), n = !0, !(0 > r.keyCode || void 0 != r.returnValue)) {
                            t: {
                                var o = !1;
                                if (0 == r.keyCode) try {
                                    r.keyCode = -1;
                                    break t
                                } catch (t) {
                                    o = !0
                                }(o || void 0 == r.returnValue) && (r.returnValue = !0)
                            }
                            for (r = [], o = e.b; o; o = o.parentNode) r.push(o);
                            for (t = t.type, o = r.length - 1; 0 <= o; o--) {
                                e.b = r[o];
                                var a = Ae(r[o], t, !0, e);
                                n = n && a
                            }
                            for (o = 0; o < r.length; o++) e.b = r[o],
                            a = Ae(r[o], t, !1, e),
                            n = n && a
                        }
                        return n
                    }
                    return Ee(t, new se(e, this))
                }

                function ke(t) {
                    return (t = t[ve]) instanceof le ? t : null
                }
                var Ne = "__closure_events_fn_" + (1e9 * Math.random() >>> 0);

                function _e(t) {
                    return f(t) ? t : (t[Ne] || (t[Ne] = function (e) {
                        return t.handleEvent(e)
                    }), t[Ne])
                }

                function Oe() {
                    xt.call(this), this.m = new le(this), this.Nb = this, this.Ua = null
                }

                function Pe(t, e, n, i, r) {
                    t.m.add(String(e), n, !1, i, r)
                }

                function Re(t, e, n, i, r) {
                    t.m.add(String(e), n, !0, i, r)
                }

                function Ce(t, e, n, i) {
                    if (!(e = t.m.a[String(e)])) return !0;
                    e = e.concat();
                    for (var r = !0, o = 0; o < e.length; ++o) {
                        var a = e[o];
                        if (a && !a.na && a.capture == n) {
                            var s = a.listener,
                                u = a.La || a.src;
                            a.Ia && de(t.m, a), r = !1 !== s.call(u, i) && r
                        }
                    }
                    return r && 0 != i.Gb
                }

                function De(t, e, n) {
                    if (f(t)) n && (t = g(t, n));
                    else {
                        if (!t || "function" != typeof t.handleEvent) throw Error("Invalid listener argument");
                        t = g(t.handleEvent, t)
                    }
                    return 2147483647 < Number(e) ? -1 : i.setTimeout(t, e || 0)
                }

                function Le(t) {
                    var e = null;
                    return new vt(function (n, i) {
                        -1 == (e = De(function () {
                            n(void 0)
                        }, t)) && i(Error("Failed to schedule timer."))
                    }).s(function (t) {
                        throw i.clearTimeout(e), t
                    })
                }

                function xe(t) {
                    if (t.S && "function" == typeof t.S) return t.S();
                    if (r(t)) return t.split("");
                    if (h(t)) {
                        for (var e = [], n = t.length, i = 0; i < n; i++) e.push(t[i]);
                        return e
                    }
                    for (i in e = [], n = 0, t) e[n++] = t[i];
                    return e
                }

                function Me(t) {
                    if (t.U && "function" == typeof t.U) return t.U();
                    if (!t.S || "function" != typeof t.S) {
                        if (h(t) || r(t)) {
                            var e = [];
                            t = t.length;
                            for (var n = 0; n < t; n++) e.push(n);
                            return e
                        }
                        for (var i in e = [], n = 0, t) e[n++] = i;
                        return e
                    }
                }

                function je(t, e) {
                    this.b = {}, this.a = [], this.c = 0;
                    var n = arguments.length;
                    if (1 < n) {
                        if (n % 2) throw Error("Uneven number of arguments");
                        for (var i = 0; i < n; i += 2) this.set(arguments[i], arguments[i + 1])
                    } else if (t)
                        if (t instanceof je)
                            for (n = t.U(), i = 0; i < n.length; i++) this.set(n[i], t.get(n[i]));
                        else
                            for (i in t) this.set(i, t[i])
                }

                function Ue(t) {
                    if (t.c != t.a.length) {
                        for (var e = 0, n = 0; e < t.a.length;) {
                            var i = t.a[e];
                            Ve(t.b, i) && (t.a[n++] = i), e++
                        }
                        t.a.length = n
                    }
                    if (t.c != t.a.length) {
                        var r = {};
                        for (n = e = 0; e < t.a.length;) Ve(r, i = t.a[e]) || (t.a[n++] = i, r[i] = 1), e++;
                        t.a.length = n
                    }
                }

                function Ve(t, e) {
                    return Object.prototype.hasOwnProperty.call(t, e)
                }
                w(Oe, xt), Oe.prototype[ce] = !0, Oe.prototype.addEventListener = function (t, e, n, i) {
                    ge(this, t, e, n, i)
                }, Oe.prototype.removeEventListener = function (t, e, n, i) {
                    we(this, t, e, n, i)
                }, Oe.prototype.dispatchEvent = function (t) {
                    var e, n = this.Ua;
                    if (n)
                        for (e = []; n; n = n.Ua) e.push(n);
                    n = this.Nb;
                    var i = t.type || t;
                    if (r(t)) t = new ae(t, n);
                    else if (t instanceof ae) t.target = t.target || n;
                    else {
                        var o = t;
                        ct(t = new ae(i, n), o)
                    }
                    if (o = !0, e)
                        for (var a = e.length - 1; 0 <= a; a--) {
                            var s = t.b = e[a];
                            o = Ce(s, i, !0, t) && o
                        }
                    if (o = Ce(s = t.b = n, i, !0, t) && o, o = Ce(s, i, !1, t) && o, e)
                        for (a = 0; a < e.length; a++) o = Ce(s = t.b = e[a], i, !1, t) && o;
                    return o
                }, Oe.prototype.ua = function () {
                    if (Oe.lb.ua.call(this), this.m) {
                        var t, e = this.m;
                        for (t in e.a) {
                            for (var n = e.a[t], i = 0; i < n.length; i++) fe(n[i]);
                            delete e.a[t], e.b--
                        }
                    }
                    this.Ua = null
                }, (t = je.prototype).S = function () {
                    Ue(this);
                    for (var t = [], e = 0; e < this.a.length; e++) t.push(this.b[this.a[e]]);
                    return t
                }, t.U = function () {
                    return Ue(this), this.a.concat()
                }, t.clear = function () {
                    this.b = {}, this.c = this.a.length = 0
                }, t.get = function (t, e) {
                    return Ve(this.b, t) ? this.b[t] : e
                }, t.set = function (t, e) {
                    Ve(this.b, t) || (this.c++, this.a.push(t)), this.b[t] = e
                }, t.forEach = function (t, e) {
                    for (var n = this.U(), i = 0; i < n.length; i++) {
                        var r = n[i],
                            o = this.get(r);
                        t.call(e, o, r, this)
                    }
                };
                var Fe = /^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#([\s\S]*))?$/;

                function Ke(t, e) {
                    if (this.b = this.m = this.c = "", this.i = null, this.h = this.g = "", this.f = !1, t instanceof Ke) {
                        this.f = void 0 !== e ? e : t.f, He(this, t.c), this.m = t.m, this.b = t.b, qe(this, t.i), this.g = t.g, e = t.a;
                        var n = new rn;
                        n.c = e.c, e.a && (n.a = new je(e.a), n.b = e.b), We(this, n), this.h = t.h
                    } else t && (n = String(t).match(Fe)) ? (this.f = !!e, He(this, n[1] || "", !0), this.m = Je(n[2] || ""), this.b = Je(n[3] || "", !0), qe(this, n[4]), this.g = Je(n[5] || "", !0), We(this, n[6] || "", !0), this.h = Je(n[7] || "")) : (this.f = !!e, this.a = new rn(null, this.f))
                }

                function He(t, e, n) {
                    t.c = n ? Je(e, !0) : e, t.c && (t.c = t.c.replace(/:$/, ""))
                }

                function qe(t, e) {
                    if (e) {
                        if (e = Number(e), isNaN(e) || 0 > e) throw Error("Bad port number " + e);
                        t.i = e
                    } else t.i = null
                }

                function We(t, e, n) {
                    e instanceof rn ? (t.a = e, function (t, e) {
                        e && !t.f && (on(t), t.c = null, t.a.forEach(function (t, e) {
                            var n = e.toLowerCase();
                            e != n && (sn(this, e), cn(this, n, t))
                        }, t)), t.f = e
                    }(t.a, t.f)) : (n || (e = Ye(e, en)), t.a = new rn(e, t.f))
                }

                function Ge(t, e, n) {
                    t.a.set(e, n)
                }

                function Be(t, e) {
                    return t.a.get(e)
                }

                function Xe(t) {
                    return t instanceof Ke ? new Ke(t) : new Ke(t, void 0)
                }

                function ze(t, e) {
                    var n = new Ke(null, void 0);
                    return He(n, "https"), t && (n.b = t), e && (n.g = e), n
                }

                function Je(t, e) {
                    return t ? e ? decodeURI(t.replace(/%25/g, "%2525")) : decodeURIComponent(t) : ""
                }

                function Ye(t, e, n) {
                    return r(t) ? (t = encodeURI(t).replace(e, $e), n && (t = t.replace(/%25([0-9a-fA-F]{2})/g, "%$1")), t) : null
                }

                function $e(t) {
                    return "%" + ((t = t.charCodeAt(0)) >> 4 & 15).toString(16) + (15 & t).toString(16)
                }
                Ke.prototype.toString = function () {
                    var t = [],
                        e = this.c;
                    e && t.push(Ye(e, Ze, !0), ":");
                    var n = this.b;
                    return (n || "file" == e) && (t.push("//"), (e = this.m) && t.push(Ye(e, Ze, !0), "@"), t.push(encodeURIComponent(String(n)).replace(/%25([0-9a-fA-F]{2})/g, "%$1")), null != (n = this.i) && t.push(":", String(n))), (n = this.g) && (this.b && "/" != n.charAt(0) && t.push("/"), t.push(Ye(n, "/" == n.charAt(0) ? tn : Qe, !0))), (n = this.a.toString()) && t.push("?", n), (n = this.h) && t.push("#", Ye(n, nn)), t.join("")
                };
                var Ze = /[#\/\?@]/g,
                    Qe = /[#\?:]/g,
                    tn = /[#\?]/g,
                    en = /[#\?@]/g,
                    nn = /#/g;

                function rn(t, e) {
                    this.b = this.a = null, this.c = t || null, this.f = !!e
                }

                function on(t) {
                    t.a || (t.a = new je, t.b = 0, t.c && function (t, e) {
                        if (t) {
                            t = t.split("&");
                            for (var n = 0; n < t.length; n++) {
                                var i = t[n].indexOf("="),
                                    r = null;
                                if (0 <= i) {
                                    var o = t[n].substring(0, i);
                                    r = t[n].substring(i + 1)
                                } else o = t[n];
                                e(o, r ? decodeURIComponent(r.replace(/\+/g, " ")) : "")
                            }
                        }
                    }(t.c, function (e, n) {
                        t.add(decodeURIComponent(e.replace(/\+/g, " ")), n)
                    }))
                }

                function an(t) {
                    var e = Me(t);
                    if (void 0 === e) throw Error("Keys are undefined");
                    var n = new rn(null, void 0);
                    t = xe(t);
                    for (var i = 0; i < e.length; i++) {
                        var r = e[i],
                            o = t[i];
                        c(o) ? cn(n, r, o) : n.add(r, o)
                    }
                    return n
                }

                function sn(t, e) {
                    on(t), e = hn(t, e), Ve(t.a.b, e) && (t.c = null, t.b -= t.a.get(e).length, Ve((t = t.a).b, e) && (delete t.b[e], t.c--, t.a.length > 2 * t.c && Ue(t)))
                }

                function un(t, e) {
                    return on(t), e = hn(t, e), Ve(t.a.b, e)
                }

                function cn(t, e, n) {
                    sn(t, e), 0 < n.length && (t.c = null, t.a.set(hn(t, e), F(n)), t.b += n.length)
                }

                function hn(t, e) {
                    return e = String(e), t.f && (e = e.toLowerCase()), e
                }(t = rn.prototype).add = function (t, e) {
                    on(this), this.c = null, t = hn(this, t);
                    var n = this.a.get(t);
                    return n || this.a.set(t, n = []), n.push(e), this.b += 1, this
                }, t.clear = function () {
                    this.a = this.c = null, this.b = 0
                }, t.forEach = function (t, e) {
                    on(this), this.a.forEach(function (n, i) {
                        D(n, function (n) {
                            t.call(e, n, i, this)
                        }, this)
                    }, this)
                }, t.U = function () {
                    on(this);
                    for (var t = this.a.S(), e = this.a.U(), n = [], i = 0; i < e.length; i++)
                        for (var r = t[i], o = 0; o < r.length; o++) n.push(e[i]);
                    return n
                }, t.S = function (t) {
                    on(this);
                    var e = [];
                    if (r(t)) un(this, t) && (e = V(e, this.a.get(hn(this, t))));
                    else {
                        t = this.a.S();
                        for (var n = 0; n < t.length; n++) e = V(e, t[n])
                    }
                    return e
                }, t.set = function (t, e) {
                    return on(this), this.c = null, un(this, t = hn(this, t)) && (this.b -= this.a.get(t).length), this.a.set(t, [e]), this.b += 1, this
                }, t.get = function (t, e) {
                    return 0 < (t = t ? this.S(t) : []).length ? String(t[0]) : e
                }, t.toString = function () {
                    if (this.c) return this.c;
                    if (!this.a) return "";
                    for (var t = [], e = this.a.U(), n = 0; n < e.length; n++) {
                        var i = e[n],
                            r = encodeURIComponent(String(i));
                        i = this.S(i);
                        for (var o = 0; o < i.length; o++) {
                            var a = r;
                            "" !== i[o] && (a += "=" + encodeURIComponent(String(i[o]))), t.push(a)
                        }
                    }
                    return this.c = t.join("&")
                };
                var fn = !qt || 9 <= Number(Zt);

                function ln() {
                    this.a = "", this.b = pn
                }

                function dn(t) {
                    return t instanceof ln && t.constructor === ln && t.b === pn ? t.a : (S("expected object of type Const, got '" + t + "'"), "type_error:Const")
                }
                ln.prototype.ma = !0, ln.prototype.la = function () {
                    return this.a
                }, ln.prototype.toString = function () {
                    return "Const{" + this.a + "}"
                };
                var pn = {};

                function vn(t) {
                    var e = new ln;
                    return e.a = t, e
                }

                function mn() {
                    this.a = "", this.b = In
                }

                function gn(t) {
                    return t instanceof mn && t.constructor === mn && t.b === In ? t.a : (S("expected object of type TrustedResourceUrl, got '" + t + "' of type " + s(t)), "type_error:TrustedResourceUrl")
                }

                function bn(t, e) {
                    var n = dn(t);
                    if (!wn.test(n)) throw Error("Invalid TrustedResourceUrl format: " + n);
                    return function (t) {
                        var e = new mn;
                        return e.a = t, e
                    }(t = n.replace(yn, function (t, i) {
                        if (!Object.prototype.hasOwnProperty.call(e, i)) throw Error('Found marker, "' + i + '", in format string, "' + n + '", but no valid label mapping found in args: ' + JSON.stringify(e));
                        return (t = e[i]) instanceof ln ? dn(t) : encodeURIComponent(String(t))
                    }))
                }
                vn(""), mn.prototype.ma = !0, mn.prototype.la = function () {
                    return this.a
                }, mn.prototype.toString = function () {
                    return "TrustedResourceUrl{" + this.a + "}"
                };
                var yn = /%{(\w+)}/g,
                    wn = /^(?:https:)?\/\/[0-9a-z.:[\]-]+\/|^\/[^\/\\]|^about:blank#/i,
                    In = {};

                function Tn() {
                    this.a = "", this.b = kn
                }

                function An(t) {
                    return t instanceof Tn && t.constructor === Tn && t.b === kn ? t.a : (S("expected object of type SafeUrl, got '" + t + "' of type " + s(t)), "type_error:SafeUrl")
                }
                Tn.prototype.ma = !0, Tn.prototype.la = function () {
                    return this.a
                }, Tn.prototype.toString = function () {
                    return "SafeUrl{" + this.a + "}"
                };
                var En = /^(?:(?:https?|mailto|ftp):|[^:/?#]*(?:[/?#]|$))/i;

                function Sn(t) {
                    return t instanceof Tn ? t : (t = t.ma ? t.la() : String(t), En.test(t) || (t = "about:invalid#zClosurez"), Nn(t))
                }
                var kn = {};

                function Nn(t) {
                    var e = new Tn;
                    return e.a = t, e
                }

                function _n() {
                    this.a = "", this.b = On
                }
                Nn("about:blank"), _n.prototype.ma = !0, _n.prototype.la = function () {
                    return this.a
                }, _n.prototype.toString = function () {
                    return "SafeHtml{" + this.a + "}"
                };
                var On = {};

                function Pn(t) {
                    var e = new _n;
                    return e.a = t, e
                }

                function Rn(t) {
                    var e = document;
                    return r(t) ? e.getElementById(t) : t
                }

                function Cn(t, e) {
                    it(e, function (e, n) {
                        e && e.ma && (e = e.la()), "style" == n ? t.style.cssText = e : "class" == n ? t.className = e : "for" == n ? t.htmlFor = e : Dn.hasOwnProperty(n) ? t.setAttribute(Dn[n], e) : 0 == n.lastIndexOf("aria-", 0) || 0 == n.lastIndexOf("data-", 0) ? t.setAttribute(n, e) : t[n] = e
                    })
                }
                Pn("<!DOCTYPE html>"), Pn(""), Pn("<br>");
                var Dn = {
                    cellpadding: "cellPadding",
                    cellspacing: "cellSpacing",
                    colspan: "colSpan",
                    frameborder: "frameBorder",
                    height: "height",
                    maxlength: "maxLength",
                    nonce: "nonce",
                    role: "role",
                    rowspan: "rowSpan",
                    type: "type",
                    usemap: "useMap",
                    valign: "vAlign",
                    width: "width"
                };

                function Ln(t, e, n) {
                    var i = arguments,
                        o = document,
                        a = String(i[0]),
                        s = i[1];
                    if (!fn && s && (s.name || s.type)) {
                        if (a = ["<", a], s.name && a.push(' name="', q(s.name), '"'), s.type) {
                            a.push(' type="', q(s.type), '"');
                            var u = {};
                            ct(u, s), delete u.type, s = u
                        }
                        a.push(">"), a = a.join("")
                    }
                    return a = o.createElement(a), s && (r(s) ? a.className = s : c(s) ? a.className = s.join(" ") : Cn(a, s)), 2 < i.length && function (t, e, n) {
                        function i(n) {
                            n && e.appendChild(r(n) ? t.createTextNode(n) : n)
                        }
                        for (var o = 2; o < n.length; o++) {
                            var a = n[o];
                            !h(a) || l(a) && 0 < a.nodeType ? i(a) : D(xn(a) ? F(a) : a, i)
                        }
                    }(o, a, i), a
                }

                function xn(t) {
                    if (t && "number" == typeof t.length) {
                        if (l(t)) return "function" == typeof t.item || "string" == typeof t.item;
                        if (f(t)) return "function" == typeof t.item
                    }
                    return !1
                }

                function Mn(t) {
                    var e = [];
                    return function t(e, n, i) {
                        if (null == n) i.push("null");
                        else {
                            if ("object" == typeof n) {
                                if (c(n)) {
                                    var r = n;
                                    n = r.length, i.push("[");
                                    for (var o = "", a = 0; a < n; a++) i.push(o), t(e, r[a], i), o = ",";
                                    return void i.push("]")
                                }
                                if (!(n instanceof String || n instanceof Number || n instanceof Boolean)) {
                                    for (r in i.push("{"), o = "", n) Object.prototype.hasOwnProperty.call(n, r) && ("function" != typeof (a = n[r]) && (i.push(o), Vn(r, i), i.push(":"), t(e, a, i), o = ","));
                                    return void i.push("}")
                                }
                                n = n.valueOf()
                            }
                            switch (typeof n) {
                                case "string":
                                    Vn(n, i);
                                    break;
                                case "number":
                                    i.push(isFinite(n) && !isNaN(n) ? String(n) : "null");
                                    break;
                                case "boolean":
                                    i.push(String(n));
                                    break;
                                case "function":
                                    i.push("null");
                                    break;
                                default:
                                    throw Error("Unknown type: " + typeof n)
                            }
                        }
                    }(new function () {}, t, e), e.join("")
                }
                var jn = {
                        '"': '\\"',
                        "\\": "\\\\",
                        "/": "\\/",
                        "\b": "\\b",
                        "\f": "\\f",
                        "\n": "\\n",
                        "\r": "\\r",
                        "\t": "\\t",
                        "\v": "\\u000b"
                    },
                    Un = /\uffff/.test("￿") ? /[\\"\x00-\x1f\x7f-\uffff]/g : /[\\"\x00-\x1f\x7f-\xff]/g;

                function Vn(t, e) {
                    e.push('"', t.replace(Un, function (t) {
                        var e = jn[t];
                        return e || (e = "\\u" + (65536 | t.charCodeAt(0)).toString(16).substr(1), jn[t] = e), e
                    }), '"')
                }

                function Fn() {
                    var t = ri();
                    return qt && !!Zt && 11 == Zt || /Edge\/\d+/.test(t)
                }

                function Kn() {
                    return i.window && i.window.location.href || self && self.location && self.location.href || ""
                }

                function Hn(t, e) {
                    e = e || i.window;
                    var n = "about:blank";
                    t && (n = An(Sn(t))), e.location.href = n
                }

                function qn(t) {
                    return !!((t = (t || ri()).toLowerCase()).match(/android/) || t.match(/webos/) || t.match(/iphone|ipad|ipod/) || t.match(/blackberry/) || t.match(/windows phone/) || t.match(/iemobile/))
                }

                function Wn(t) {
                    t = t || i.window;
                    try {
                        t.close()
                    } catch (t) {}
                }

                function Gn(t, e, n) {
                    var i = Math.floor(1e9 * Math.random()).toString();
                    e = e || 500, n = n || 600;
                    var r = (window.screen.availHeight - n) / 2,
                        o = (window.screen.availWidth - e) / 2;
                    for (a in e = {
                            width: e,
                            height: n,
                            top: 0 < r ? r : 0,
                            left: 0 < o ? o : 0,
                            location: !0,
                            resizable: !0,
                            statusbar: !0,
                            toolbar: !1
                        }, n = ri().toLowerCase(), i && (e.target = i, Z(n, "crios/") && (e.target = "_blank")), ei(ri()) == Qn && (t = t || "http://localhost", e.scrollbars = !0), n = t || "", (t = e) || (t = {}), i = window, e = n instanceof Tn ? n : Sn(void 0 !== n.href ? n.href : String(n)), n = t.target || n.target, r = [], t) switch (a) {
                        case "width":
                        case "height":
                        case "top":
                        case "left":
                            r.push(a + "=" + t[a]);
                            break;
                        case "target":
                        case "noopener":
                        case "noreferrer":
                            break;
                        default:
                            r.push(a + "=" + (t[a] ? 1 : 0))
                    }
                    var a = r.join(",");
                    if ((nt("iPhone") && !nt("iPod") && !nt("iPad") || nt("iPad") || nt("iPod")) && i.navigator && i.navigator.standalone && n && "_self" != n ? (a = i.document.createElement("A"), e instanceof Tn || e instanceof Tn || (e = e.ma ? e.la() : String(e), En.test(e) || (e = "about:invalid#zClosurez"), e = Nn(e)), a.href = An(e), a.setAttribute("target", n), t.noreferrer && a.setAttribute("rel", "noreferrer"), (t = document.createEvent("MouseEvent")).initMouseEvent("click", !0, !0, i, 1), a.dispatchEvent(t), a = {}) : t.noreferrer ? (a = i.open("", n, a), t = An(e), a && (Gt && Z(t, ";") && (t = "'" + t.replace(/'/g, "%27") + "'"), a.opener = null, vn("b/12014412, meta tag with sanitized URL"), t = Pn(t = '<meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0; url=' + q(t) + '">'), a.document.write(function (t) {
                            return t instanceof _n && t.constructor === _n && t.b === On ? t.a : (S("expected object of type SafeHtml, got '" + t + "' of type " + s(t)), "type_error:SafeHtml")
                        }(t)), a.document.close())) : (a = i.open(An(e), n, a)) && t.noopener && (a.opener = null), a) try {
                        a.focus()
                    } catch (t) {}
                    return a
                }
                var Bn = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

                function Xn() {
                    var t = null;
                    return new vt(function (e) {
                        "complete" == i.document.readyState ? e() : (t = function () {
                            e()
                        }, ye(window, "load", t))
                    }).s(function (e) {
                        throw we(window, "load", t), e
                    })
                }

                function zn(t) {
                    return t = t || ri(), !("file:" !== ci() || !t.toLowerCase().match(/iphone|ipad|ipod|android/))
                }

                function Jn() {
                    var t = i.window;
                    try {
                        return !(!t || t == t.top)
                    } catch (t) {
                        return !1
                    }
                }

                function Yn() {
                    return "object" != typeof i.window && "function" == typeof i.importScripts
                }

                function $n() {
                    return e.INTERNAL.hasOwnProperty("reactNative") ? "ReactNative" : e.INTERNAL.hasOwnProperty("node") ? "Node" : Yn() ? "Worker" : "Browser"
                }

                function Zn() {
                    var t = $n();
                    return "ReactNative" === t || "Node" === t
                }
                var Qn = "Firefox",
                    ti = "Chrome";

                function ei(t) {
                    var e = t.toLowerCase();
                    return Z(e, "opera/") || Z(e, "opr/") || Z(e, "opios/") ? "Opera" : Z(e, "iemobile") ? "IEMobile" : Z(e, "msie") || Z(e, "trident/") ? "IE" : Z(e, "edge/") ? "Edge" : Z(e, "firefox/") ? Qn : Z(e, "silk/") ? "Silk" : Z(e, "blackberry") ? "Blackberry" : Z(e, "webos") ? "Webos" : !Z(e, "safari/") || Z(e, "chrome/") || Z(e, "crios/") || Z(e, "android") ? !Z(e, "chrome/") && !Z(e, "crios/") || Z(e, "edge/") ? Z(e, "android") ? "Android" : (t = t.match(/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/)) && 2 == t.length ? t[1] : "Other" : ti : "Safari"
                }
                var ni = {
                    Sc: "FirebaseCore-web",
                    Uc: "FirebaseUI-web"
                };

                function ii(t, e) {
                    e = e || [];
                    var n, i = [],
                        r = {};
                    for (n in ni) r[ni[n]] = !0;
                    for (n = 0; n < e.length; n++) void 0 !== r[e[n]] && (delete r[e[n]], i.push(e[n]));
                    return i.sort(), (e = i).length || (e = ["FirebaseCore-web"]), "Browser" === (i = $n()) ? i = ei(r = ri()) : "Worker" === i && (i = ei(r = ri()) + "-" + i), i + "/JsCore/" + t + "/" + e.join(",")
                }

                function ri() {
                    return i.navigator && i.navigator.userAgent || ""
                }

                function oi(t, e) {
                    t = t.split("."), e = e || i;
                    for (var n = 0; n < t.length && "object" == typeof e && null != e; n++) e = e[t[n]];
                    return n != t.length && (e = void 0), e
                }

                function ai() {
                    try {
                        var t = i.localStorage,
                            e = pi();
                        if (t) return t.setItem(e, "1"), t.removeItem(e), !Fn() || !!i.indexedDB
                    } catch (t) {
                        return Yn() && !!i.indexedDB
                    }
                    return !1
                }

                function si() {
                    return (ui() || "chrome-extension:" === ci() || zn()) && !Zn() && ai() && !Yn()
                }

                function ui() {
                    return "http:" === ci() || "https:" === ci()
                }

                function ci() {
                    return i.location && i.location.protocol || null
                }

                function hi(t) {
                    return !qn(t = t || ri()) && ei(t) != Qn
                }

                function fi(t) {
                    return void 0 === t ? null : Mn(t)
                }

                function li(t) {
                    var e, n = {};
                    for (e in t) t.hasOwnProperty(e) && null !== t[e] && void 0 !== t[e] && (n[e] = t[e]);
                    return n
                }

                function di(t) {
                    if (null !== t) return JSON.parse(t)
                }

                function pi(t) {
                    return t || Math.floor(1e9 * Math.random()).toString()
                }

                function vi(t) {
                    return "Safari" != ei(t = t || ri()) && !t.toLowerCase().match(/iphone|ipad|ipod/)
                }

                function mi() {
                    var t = i.___jsl;
                    if (t && t.H)
                        for (var e in t.H)
                            if (t.H[e].r = t.H[e].r || [], t.H[e].L = t.H[e].L || [], t.H[e].r = t.H[e].L.concat(), t.CP)
                                for (var n = 0; n < t.CP.length; n++) t.CP[n] = null
                }

                function gi(t, e) {
                    if (t > e) throw Error("Short delay should be less than long delay!");
                    this.a = t, this.c = e, t = ri(), e = $n(), this.b = qn(t) || "ReactNative" === e
                }

                function bi() {
                    var t = i.document;
                    return !t || void 0 === t.visibilityState || "visible" == t.visibilityState
                }

                function yi(t) {
                    try {
                        var e = new Date(parseInt(t, 10));
                        if (!isNaN(e.getTime()) && !/[^0-9]/.test(t)) return e.toUTCString()
                    } catch (t) {}
                    return null
                }

                function wi() {
                    return !(!oi("fireauth.oauthhelper", i) && !oi("fireauth.iframe", i))
                }
                gi.prototype.get = function () {
                    var t = i.navigator;
                    return !t || "boolean" != typeof t.onLine || !ui() && "chrome-extension:" !== ci() && void 0 === t.connection || t.onLine ? this.b ? this.c : this.a : Math.min(5e3, this.a)
                };
                var Ii, Ti = {};

                function Ai(t) {
                    Ti[t] || (Ti[t] = !0, "undefined" != typeof console && "function" == typeof console.warn && console.warn(t))
                }
                try {
                    var Ei = {};
                    Object.defineProperty(Ei, "abcd", {
                        configurable: !0,
                        enumerable: !0,
                        value: 1
                    }), Object.defineProperty(Ei, "abcd", {
                        configurable: !0,
                        enumerable: !0,
                        value: 2
                    }), Ii = 2 == Ei.abcd
                } catch (Kt) {
                    Ii = !1
                }

                function Si(t, e, n) {
                    Ii ? Object.defineProperty(t, e, {
                        configurable: !0,
                        enumerable: !0,
                        value: n
                    }) : t[e] = n
                }

                function ki(t, e) {
                    if (e)
                        for (var n in e) e.hasOwnProperty(n) && Si(t, n, e[n])
                }

                function Ni(t) {
                    var e = {};
                    return ki(e, t), e
                }

                function _i(t) {
                    var e = t;
                    if ("object" == typeof t && null != t)
                        for (var n in e = "length" in t ? [] : {}, t) Si(e, n, _i(t[n]));
                    return e
                }
                var Oi = "EMAIL_SIGNIN",
                    Pi = "email",
                    Ri = "newEmail",
                    Ci = "requestType",
                    Di = "email",
                    Li = "fromEmail",
                    xi = "data",
                    Mi = "operation";

                function ji(t, e) {
                    this.code = Vi + t, this.message = e || Fi[t] || ""
                }

                function Ui(t) {
                    var e = t && t.code;
                    return e ? new ji(e.substring(Vi.length), t.message) : null
                }
                w(ji, Error), ji.prototype.D = function () {
                    return {
                        code: this.code,
                        message: this.message
                    }
                }, ji.prototype.toJSON = function () {
                    return this.D()
                };
                var Vi = "auth/",
                    Fi = {
                        "argument-error": "",
                        "app-not-authorized": "This app, identified by the domain where it's hosted, is not authorized to use Firebase Authentication with the provided API key. Review your key configuration in the Google API console.",
                        "app-not-installed": "The requested mobile application corresponding to the identifier (Android package name or iOS bundle ID) provided is not installed on this device.",
                        "captcha-check-failed": "The reCAPTCHA response token provided is either invalid, expired, already used or the domain associated with it does not match the list of whitelisted domains.",
                        "code-expired": "The SMS code has expired. Please re-send the verification code to try again.",
                        "cordova-not-ready": "Cordova framework is not ready.",
                        "cors-unsupported": "This browser is not supported.",
                        "credential-already-in-use": "This credential is already associated with a different user account.",
                        "custom-token-mismatch": "The custom token corresponds to a different audience.",
                        "requires-recent-login": "This operation is sensitive and requires recent authentication. Log in again before retrying this request.",
                        "dynamic-link-not-activated": "Please activate Dynamic Links in the Firebase Console and agree to the terms and conditions.",
                        "email-already-in-use": "The email address is already in use by another account.",
                        "expired-action-code": "The action code has expired. ",
                        "cancelled-popup-request": "This operation has been cancelled due to another conflicting popup being opened.",
                        "internal-error": "An internal error has occurred.",
                        "invalid-app-credential": "The phone verification request contains an invalid application verifier. The reCAPTCHA token response is either invalid or expired.",
                        "invalid-app-id": "The mobile app identifier is not registed for the current project.",
                        "invalid-user-token": "This user's credential isn't valid for this project. This can happen if the user's token has been tampered with, or if the user isn't for the project associated with this API key.",
                        "invalid-auth-event": "An internal error has occurred.",
                        "invalid-verification-code": "The SMS verification code used to create the phone auth credential is invalid. Please resend the verification code sms and be sure use the verification code provided by the user.",
                        "invalid-continue-uri": "The continue URL provided in the request is invalid.",
                        "invalid-cordova-configuration": "The following Cordova plugins must be installed to enable OAuth sign-in: cordova-plugin-buildinfo, cordova-universal-links-plugin, cordova-plugin-browsertab, cordova-plugin-inappbrowser and cordova-plugin-customurlscheme.",
                        "invalid-custom-token": "The custom token format is incorrect. Please check the documentation.",
                        "invalid-email": "The email address is badly formatted.",
                        "invalid-api-key": "Your API key is invalid, please check you have copied it correctly.",
                        "invalid-cert-hash": "The SHA-1 certificate hash provided is invalid.",
                        "invalid-credential": "The supplied auth credential is malformed or has expired.",
                        "invalid-persistence-type": "The specified persistence type is invalid. It can only be local, session or none.",
                        "invalid-message-payload": "The email template corresponding to this action contains invalid characters in its message. Please fix by going to the Auth email templates section in the Firebase Console.",
                        "invalid-oauth-provider": "EmailAuthProvider is not supported for this operation. This operation only supports OAuth providers.",
                        "invalid-oauth-client-id": "The OAuth client ID provided is either invalid or does not match the specified API key.",
                        "unauthorized-domain": "This domain is not authorized for OAuth operations for your Firebase project. Edit the list of authorized domains from the Firebase console.",
                        "invalid-action-code": "The action code is invalid. This can happen if the code is malformed, expired, or has already been used.",
                        "wrong-password": "The password is invalid or the user does not have a password.",
                        "invalid-phone-number": "The format of the phone number provided is incorrect. Please enter the phone number in a format that can be parsed into E.164 format. E.164 phone numbers are written in the format [+][country code][subscriber number including area code].",
                        "invalid-recipient-email": "The email corresponding to this action failed to send as the provided recipient email address is invalid.",
                        "invalid-sender": "The email template corresponding to this action contains an invalid sender email or name. Please fix by going to the Auth email templates section in the Firebase Console.",
                        "invalid-verification-id": "The verification ID used to create the phone auth credential is invalid.",
                        "missing-android-pkg-name": "An Android Package Name must be provided if the Android App is required to be installed.",
                        "auth-domain-config-required": "Be sure to include authDomain when calling firebase.initializeApp(), by following the instructions in the Firebase console.",
                        "missing-app-credential": "The phone verification request is missing an application verifier assertion. A reCAPTCHA response token needs to be provided.",
                        "missing-verification-code": "The phone auth credential was created with an empty SMS verification code.",
                        "missing-continue-uri": "A continue URL must be provided in the request.",
                        "missing-iframe-start": "An internal error has occurred.",
                        "missing-ios-bundle-id": "An iOS Bundle ID must be provided if an App Store ID is provided.",
                        "missing-phone-number": "To send verification codes, provide a phone number for the recipient.",
                        "missing-verification-id": "The phone auth credential was created with an empty verification ID.",
                        "app-deleted": "This instance of FirebaseApp has been deleted.",
                        "account-exists-with-different-credential": "An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.",
                        "network-request-failed": "A network error (such as timeout, interrupted connection or unreachable host) has occurred.",
                        "no-auth-event": "An internal error has occurred.",
                        "no-such-provider": "User was not linked to an account with the given provider.",
                        "null-user": "A null user object was provided as the argument for an operation which requires a non-null user object.",
                        "operation-not-allowed": "The given sign-in provider is disabled for this Firebase project. Enable it in the Firebase console, under the sign-in method tab of the Auth section.",
                        "operation-not-supported-in-this-environment": 'This operation is not supported in the environment this application is running on. "location.protocol" must be http, https or chrome-extension and web storage must be enabled.',
                        "popup-blocked": "Unable to establish a connection with the popup. It may have been blocked by the browser.",
                        "popup-closed-by-user": "The popup has been closed by the user before finalizing the operation.",
                        "provider-already-linked": "User can only be linked to one identity for the given provider.",
                        "quota-exceeded": "The project's quota for this operation has been exceeded.",
                        "redirect-cancelled-by-user": "The redirect operation has been cancelled by the user before finalizing.",
                        "redirect-operation-pending": "A redirect sign-in operation is already pending.",
                        timeout: "The operation has timed out.",
                        "user-token-expired": "The user's credential is no longer valid. The user must sign in again.",
                        "too-many-requests": "We have blocked all requests from this device due to unusual activity. Try again later.",
                        "unauthorized-continue-uri": "The domain of the continue URL is not whitelisted.  Please whitelist the domain in the Firebase console.",
                        "unsupported-persistence-type": "The current environment does not support the specified persistence type.",
                        "user-cancelled": "User did not grant your application the permissions it requested.",
                        "user-not-found": "There is no user record corresponding to this identifier. The user may have been deleted.",
                        "user-disabled": "The user account has been disabled by an administrator.",
                        "user-mismatch": "The supplied credentials do not correspond to the previously signed in user.",
                        "user-signed-out": "",
                        "weak-password": "The password must be 6 characters long or more.",
                        "web-storage-unsupported": "This browser is not supported or 3rd party cookies and data may be disabled."
                    };

                function Ki(t) {
                    var e = t[Gi];
                    if (void 0 === e) throw new ji("missing-continue-uri");
                    if ("string" != typeof e || "string" == typeof e && !e.length) throw new ji("invalid-continue-uri");
                    this.h = e, this.b = this.a = null, this.g = !1;
                    var n = t[Hi];
                    if (n && "object" == typeof n) {
                        e = n[zi];
                        var i = n[Bi];
                        if (n = n[Xi], "string" == typeof e && e.length) {
                            if (this.a = e, void 0 !== i && "boolean" != typeof i) throw new ji("argument-error", Bi + " property must be a boolean when specified.");
                            if (this.g = !!i, void 0 !== n && ("string" != typeof n || "string" == typeof n && !n.length)) throw new ji("argument-error", Xi + " property must be a non empty string when specified.");
                            this.b = n || null
                        } else {
                            if (void 0 !== e) throw new ji("argument-error", zi + " property must be a non empty string when specified.");
                            if (void 0 !== i || void 0 !== n) throw new ji("missing-android-pkg-name")
                        }
                    } else if (void 0 !== n) throw new ji("argument-error", Hi + " property must be a non null object when specified.");
                    if (this.f = null, (e = t[Wi]) && "object" == typeof e) {
                        if ("string" == typeof (e = e[Ji]) && e.length) this.f = e;
                        else if (void 0 !== e) throw new ji("argument-error", Ji + " property must be a non empty string when specified.")
                    } else if (void 0 !== e) throw new ji("argument-error", Wi + " property must be a non null object when specified.");
                    if (void 0 !== (t = t[qi]) && "boolean" != typeof t) throw new ji("argument-error", qi + " property must be a boolean when specified.");
                    this.c = !!t
                }
                var Hi = "android",
                    qi = "handleCodeInApp",
                    Wi = "iOS",
                    Gi = "url",
                    Bi = "installApp",
                    Xi = "minimumVersion",
                    zi = "packageName",
                    Ji = "bundleId";

                function Yi(t) {
                    var e = {};
                    for (var n in e.continueUrl = t.h, e.canHandleCodeInApp = t.c, (e.androidPackageName = t.a) && (e.androidMinimumVersion = t.b, e.androidInstallApp = t.g), e.iOSBundleId = t.f, e) null === e[n] && delete e[n];
                    return e
                }
                var $i = null,
                    Zi = null;

                function Qi(t) {
                    var e = "";
                    return function (t, e) {
                        function n(e) {
                            for (; i < t.length;) {
                                var n = t.charAt(i++),
                                    r = Zi[n];
                                if (null != r) return r;
                                if (!/^[\s\xa0]*$/.test(n)) throw Error("Unknown base64 encoding at char: " + n)
                            }
                            return e
                        }! function () {
                            if (!$i) {
                                $i = {}, Zi = {};
                                for (var t = 0; 65 > t; t++) $i[t] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(t), Zi[$i[t]] = t, 62 <= t && (Zi["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.".charAt(t)] = t)
                            }
                        }();
                        for (var i = 0;;) {
                            var r = n(-1),
                                o = n(0),
                                a = n(64),
                                s = n(64);
                            if (64 === s && -1 === r) break;
                            e(r << 2 | o >> 4), 64 != a && (e(o << 4 & 240 | a >> 2), 64 != s && e(a << 6 & 192 | s))
                        }
                    }(t, function (t) {
                        e += String.fromCharCode(t)
                    }), e
                }

                function tr(t) {
                    this.c = t.sub, this.a = t.provider_id || t.firebase && t.firebase.sign_in_provider || null, this.b = !!t.is_anonymous || "anonymous" == this.a
                }

                function er(t) {
                    return (t = nr(t)) && t.sub && t.iss && t.aud && t.exp ? new tr(t) : null
                }

                function nr(t) {
                    if (!t) return null;
                    if (3 != (t = t.split(".")).length) return null;
                    for (var e = (4 - (t = t[1]).length % 4) % 4, n = 0; n < e; n++) t += ".";
                    try {
                        return JSON.parse(Qi(t))
                    } catch (t) {}
                    return null
                }
                tr.prototype.f = function () {
                    return this.b
                };
                var ir = "oauth_consumer_key oauth_nonce oauth_signature oauth_signature_method oauth_timestamp oauth_token oauth_version".split(" "),
                    rr = ["client_id", "response_type", "scope", "redirect_uri", "state"],
                    or = {
                        Tc: {
                            Ma: "locale",
                            Ba: 500,
                            Aa: 600,
                            Na: "facebook.com",
                            eb: rr
                        },
                        Vc: {
                            Ma: null,
                            Ba: 500,
                            Aa: 620,
                            Na: "github.com",
                            eb: rr
                        },
                        Wc: {
                            Ma: "hl",
                            Ba: 515,
                            Aa: 680,
                            Na: "google.com",
                            eb: rr
                        },
                        bd: {
                            Ma: "lang",
                            Ba: 485,
                            Aa: 705,
                            Na: "twitter.com",
                            eb: ir
                        }
                    };

                function ar(t) {
                    for (var e in or)
                        if (or[e].Na == t) return or[e];
                    return null
                }

                function sr(t) {
                    var e = {};
                    e["facebook.com"] = lr, e["google.com"] = pr, e["github.com"] = dr, e["twitter.com"] = vr;
                    var n = t && t[cr];
                    try {
                        if (n) return e[n] ? new e[n](t) : new fr(t);
                        if (void 0 !== t[ur]) return new hr(t)
                    } catch (t) {}
                    return null
                }
                var ur = "idToken",
                    cr = "providerId";

                function hr(t) {
                    var e = t[cr];
                    if (!e && t[ur]) {
                        var n = er(t[ur]);
                        n && n.a && (e = n.a)
                    }
                    if (!e) throw Error("Invalid additional user info!");
                    "anonymous" != e && "custom" != e || (e = null), n = !1, void 0 !== t.isNewUser ? n = !!t.isNewUser : "identitytoolkit#SignupNewUserResponse" === t.kind && (n = !0), Si(this, "providerId", e), Si(this, "isNewUser", n)
                }

                function fr(t) {
                    hr.call(this, t), Si(this, "profile", _i((t = di(t.rawUserInfo || "{}")) || {}))
                }

                function lr(t) {
                    if (fr.call(this, t), "facebook.com" != this.providerId) throw Error("Invalid provider ID!")
                }

                function dr(t) {
                    if (fr.call(this, t), "github.com" != this.providerId) throw Error("Invalid provider ID!");
                    Si(this, "username", this.profile && this.profile.login || null)
                }

                function pr(t) {
                    if (fr.call(this, t), "google.com" != this.providerId) throw Error("Invalid provider ID!")
                }

                function vr(t) {
                    if (fr.call(this, t), "twitter.com" != this.providerId) throw Error("Invalid provider ID!");
                    Si(this, "username", t.screenName || null)
                }

                function mr(t) {
                    var e = Xe(t),
                        n = Be(e, "link"),
                        i = Be(Xe(n), "link");
                    return Be(Xe(e = Be(e, "deep_link_id")), "link") || e || i || n || t
                }

                function gr(t, e) {
                    return t.then(function (t) {
                        if (t[$o]) {
                            var n = er(t[$o]);
                            if (!n || e != n.c) throw new ji("user-mismatch");
                            return t
                        }
                        throw new ji("user-mismatch")
                    }).s(function (t) {
                        throw t && t.code && t.code == Vi + "user-not-found" ? new ji("user-mismatch") : t
                    })
                }

                function br(t, e, n) {
                    if (e.idToken || e.accessToken) e.idToken && Si(this, "idToken", e.idToken), e.accessToken && Si(this, "accessToken", e.accessToken);
                    else {
                        if (!e.oauthToken || !e.oauthTokenSecret) throw new ji("internal-error", "failed to construct a credential");
                        Si(this, "accessToken", e.oauthToken), Si(this, "secret", e.oauthTokenSecret)
                    }
                    Si(this, "providerId", t), Si(this, "signInMethod", n)
                }

                function yr(t) {
                    var e = {};
                    return t.idToken && (e.id_token = t.idToken), t.accessToken && (e.access_token = t.accessToken), t.secret && (e.oauth_token_secret = t.secret), e.providerId = t.providerId, {
                        postBody: an(e).toString(),
                        requestUri: "http://localhost"
                    }
                }

                function wr(t, e) {
                    this.Ac = e || [], ki(this, {
                        providerId: t,
                        isOAuthProvider: !0
                    }), this.vb = {}, this.$a = (ar(t) || {}).Ma || null, this.Ya = null
                }

                function Ir(t) {
                    wr.call(this, t, rr), this.a = []
                }

                function Tr() {
                    Ir.call(this, "facebook.com")
                }

                function Ar(t) {
                    if (!t) throw new ji("argument-error", "credential failed: expected 1 argument (the OAuth access token).");
                    var e = t;
                    return l(t) && (e = t.accessToken), (new Tr).credential(null, e)
                }

                function Er() {
                    Ir.call(this, "github.com")
                }

                function Sr(t) {
                    if (!t) throw new ji("argument-error", "credential failed: expected 1 argument (the OAuth access token).");
                    var e = t;
                    return l(t) && (e = t.accessToken), (new Er).credential(null, e)
                }

                function kr() {
                    Ir.call(this, "google.com"), this.ta("profile")
                }

                function Nr(t, e) {
                    var n = t;
                    return l(t) && (n = t.idToken, e = t.accessToken), (new kr).credential(n, e)
                }

                function _r() {
                    wr.call(this, "twitter.com", ir)
                }

                function Or(t, e) {
                    var n = t;
                    if (l(n) || (n = {
                            oauthToken: t,
                            oauthTokenSecret: e
                        }), !n.oauthToken || !n.oauthTokenSecret) throw new ji("argument-error", "credential failed: expected 2 arguments (the OAuth access token and secret).");
                    return new br("twitter.com", n, "twitter.com")
                }

                function Pr(t, e, n) {
                    this.a = t, this.b = e, Si(this, "providerId", "password"), Si(this, "signInMethod", n === Rr.EMAIL_LINK_SIGN_IN_METHOD ? Rr.EMAIL_LINK_SIGN_IN_METHOD : Rr.EMAIL_PASSWORD_SIGN_IN_METHOD)
                }

                function Rr() {
                    ki(this, {
                        providerId: "password",
                        isOAuthProvider: !1
                    })
                }

                function Cr(t, e) {
                    if (!(e = Dr(e))) throw new ji("argument-error", "Invalid email link!");
                    return new Pr(t, e, Rr.EMAIL_LINK_SIGN_IN_METHOD)
                }

                function Dr(t) {
                    var e = Be((t = new function (t) {
                        this.a = Xe(t)
                    }(t = mr(t))).a, "oobCode") || null;
                    return "signIn" === (Be(t.a, "mode") || null) && e ? e : null
                }

                function Lr(t) {
                    if (!(t.Sa && t.Ra || t.Fa && t.$)) throw new ji("internal-error");
                    this.a = t, Si(this, "providerId", "phone"), Si(this, "signInMethod", "phone")
                }

                function xr(t) {
                    return t.a.Fa && t.a.$ ? {
                        temporaryProof: t.a.Fa,
                        phoneNumber: t.a.$
                    } : {
                        sessionInfo: t.a.Sa,
                        code: t.a.Ra
                    }
                }

                function Mr(t) {
                    try {
                        this.a = t || e.auth()
                    } catch (t) {
                        throw new ji("argument-error", "Either an instance of firebase.auth.Auth must be passed as an argument to the firebase.auth.PhoneAuthProvider constructor, or the default firebase App instance must be initialized via firebase.initializeApp().")
                    }
                    ki(this, {
                        providerId: "phone",
                        isOAuthProvider: !1
                    })
                }

                function jr(t, e) {
                    if (!t) throw new ji("missing-verification-id");
                    if (!e) throw new ji("missing-verification-code");
                    return new Lr({
                        Sa: t,
                        Ra: e
                    })
                }

                function Ur(t) {
                    if (t.temporaryProof && t.phoneNumber) return new Lr({
                        Fa: t.temporaryProof,
                        $: t.phoneNumber
                    });
                    var e = t && t.providerId;
                    if (!e || "password" === e) return null;
                    var n = t && t.oauthAccessToken,
                        i = t && t.oauthTokenSecret;
                    t = t && t.oauthIdToken;
                    try {
                        switch (e) {
                            case "google.com":
                                return Nr(t, n);
                            case "facebook.com":
                                return Ar(n);
                            case "github.com":
                                return Sr(n);
                            case "twitter.com":
                                return Or(n, i);
                            default:
                                return new Ir(e).credential(t, n)
                        }
                    } catch (t) {
                        return null
                    }
                }

                function Vr(t) {
                    if (!t.isOAuthProvider) throw new ji("invalid-oauth-provider")
                }

                function Fr(t, e, n, i, r) {
                    if (this.b = t, this.c = e || null, this.f = n || null, this.g = i || null, this.a = r || null, !this.f && !this.a) throw new ji("invalid-auth-event");
                    if (this.f && this.a) throw new ji("invalid-auth-event");
                    if (this.f && !this.g) throw new ji("invalid-auth-event")
                }

                function Kr(t) {
                    return (t = t || {}).type ? new Fr(t.type, t.eventId, t.urlResponse, t.sessionId, t.error && Ui(t.error)) : null
                }

                function Hr() {
                    this.b = null, this.a = []
                }
                w(fr, hr), w(lr, fr), w(dr, fr), w(pr, fr), w(vr, fr), br.prototype.ya = function (t) {
                    return pa(t, yr(this))
                }, br.prototype.c = function (t, e) {
                    var n = yr(this);
                    return n.idToken = e, va(t, n)
                }, br.prototype.f = function (t, e) {
                    return gr(ma(t, yr(this)), e)
                }, br.prototype.D = function () {
                    var t = {
                        providerId: this.providerId,
                        signInMethod: this.signInMethod
                    };
                    return this.idToken && (t.oauthIdToken = this.idToken), this.accessToken && (t.oauthAccessToken = this.accessToken), this.secret && (t.oauthTokenSecret = this.secret), t
                }, wr.prototype.Da = function (t) {
                    return this.vb = ot(t), this
                }, w(Ir, wr), Ir.prototype.ta = function (t) {
                    return M(this.a, t) || this.a.push(t), this
                }, Ir.prototype.Ab = function () {
                    return F(this.a)
                }, Ir.prototype.credential = function (t, e) {
                    if (!t && !e) throw new ji("argument-error", "credential failed: must provide the ID token and/or the access token.");
                    return new br(this.providerId, {
                        idToken: t || null,
                        accessToken: e || null
                    }, this.providerId)
                }, w(Tr, Ir), Si(Tr, "PROVIDER_ID", "facebook.com"), Si(Tr, "FACEBOOK_SIGN_IN_METHOD", "facebook.com"), w(Er, Ir), Si(Er, "PROVIDER_ID", "github.com"), Si(Er, "GITHUB_SIGN_IN_METHOD", "github.com"), w(kr, Ir), Si(kr, "PROVIDER_ID", "google.com"), Si(kr, "GOOGLE_SIGN_IN_METHOD", "google.com"), w(_r, wr), Si(_r, "PROVIDER_ID", "twitter.com"), Si(_r, "TWITTER_SIGN_IN_METHOD", "twitter.com"), Pr.prototype.ya = function (t) {
                    return this.signInMethod == Rr.EMAIL_LINK_SIGN_IN_METHOD ? Ga(t, Ea, {
                        email: this.a,
                        oobCode: this.b
                    }) : Ga(t, Ka, {
                        email: this.a,
                        password: this.b
                    })
                }, Pr.prototype.c = function (t, e) {
                    return this.signInMethod == Rr.EMAIL_LINK_SIGN_IN_METHOD ? Ga(t, Sa, {
                        idToken: e,
                        email: this.a,
                        oobCode: this.b
                    }) : Ga(t, xa, {
                        idToken: e,
                        email: this.a,
                        password: this.b
                    })
                }, Pr.prototype.f = function (t, e) {
                    return gr(this.ya(t), e)
                }, Pr.prototype.D = function () {
                    return {
                        email: this.a,
                        password: this.b,
                        signInMethod: this.signInMethod
                    }
                }, ki(Rr, {
                    PROVIDER_ID: "password"
                }), ki(Rr, {
                    EMAIL_LINK_SIGN_IN_METHOD: "emailLink"
                }), ki(Rr, {
                    EMAIL_PASSWORD_SIGN_IN_METHOD: "password"
                }), Lr.prototype.ya = function (t) {
                    return t.Ta(xr(this))
                }, Lr.prototype.c = function (t, e) {
                    var n = xr(this);
                    return n.idToken = e, Ga(t, qa, n)
                }, Lr.prototype.f = function (t, e) {
                    var n = xr(this);
                    return n.operation = "REAUTH", gr(t = Ga(t, Wa, n), e)
                }, Lr.prototype.D = function () {
                    var t = {
                        providerId: "phone"
                    };
                    return this.a.Sa && (t.verificationId = this.a.Sa), this.a.Ra && (t.verificationCode = this.a.Ra), this.a.Fa && (t.temporaryProof = this.a.Fa), this.a.$ && (t.phoneNumber = this.a.$), t
                }, Mr.prototype.Ta = function (t, e) {
                    var n = this.a.b;
                    return Tt(e.verify()).then(function (i) {
                        if (!r(i)) throw new ji("argument-error", "An implementation of firebase.auth.ApplicationVerifier.prototype.verify() must return a firebase.Promise that resolves with a string.");
                        switch (e.type) {
                            case "recaptcha":
                                return function (t, e) {
                                    return Ga(t, Da, e)
                                }(n, {
                                    phoneNumber: t,
                                    recaptchaToken: i
                                }).then(function (t) {
                                    return "function" == typeof e.reset && e.reset(), t
                                }, function (t) {
                                    throw "function" == typeof e.reset && e.reset(), t
                                });
                            default:
                                throw new ji("argument-error", 'Only firebase.auth.ApplicationVerifiers with type="recaptcha" are currently supported.')
                        }
                    })
                }, ki(Mr, {
                    PROVIDER_ID: "phone"
                }), ki(Mr, {
                    PHONE_SIGN_IN_METHOD: "phone"
                }), Fr.prototype.D = function () {
                    return {
                        type: this.b,
                        eventId: this.c,
                        urlResponse: this.f,
                        sessionId: this.g,
                        error: this.a && this.a.D()
                    }
                };
                var qr = null;

                function Wr(t) {
                    var e = "unauthorized-domain",
                        n = void 0,
                        i = Xe(t);
                    t = i.b, "chrome-extension" == (i = i.c) ? n = K("This chrome extension ID (chrome-extension://%s) is not authorized to run this operation. Add it to the OAuth redirect domains list in the Firebase console -> Auth section -> Sign in method tab.", t) : "http" == i || "https" == i ? n = K("This domain (%s) is not authorized to run this operation. Add it to the OAuth redirect domains list in the Firebase console -> Auth section -> Sign in method tab.", t) : e = "operation-not-supported-in-this-environment", ji.call(this, e, n)
                }

                function Gr(t, e, n) {
                    ji.call(this, t, n), (t = e || {}).wb && Si(this, "email", t.wb), t.$ && Si(this, "phoneNumber", t.$), t.credential && Si(this, "credential", t.credential)
                }

                function Br(t) {
                    if (t.code) {
                        var e = t.code || "";
                        0 == e.indexOf(Vi) && (e = e.substring(Vi.length));
                        var n = {
                            credential: Ur(t)
                        };
                        if (t.email) n.wb = t.email;
                        else {
                            if (!t.phoneNumber) return new ji(e, t.message || void 0);
                            n.$ = t.phoneNumber
                        }
                        return new Gr(e, n, t.message)
                    }
                    return null
                }
                Hr.prototype.subscribe = function (t) {
                    var e = this;
                    this.a.push(t), this.b || (this.b = function (t) {
                        for (var n = 0; n < e.a.length; n++) e.a[n](t)
                    }, "function" == typeof (t = oi("universalLinks.subscribe", i)) && t(null, this.b))
                }, Hr.prototype.unsubscribe = function (t) {
                    U(this.a, function (e) {
                        return e == t
                    })
                }, w(Wr, ji), w(Gr, ji), Gr.prototype.D = function () {
                    var t = {
                        code: this.code,
                        message: this.message
                    };
                    this.email && (t.email = this.email), this.phoneNumber && (t.phoneNumber = this.phoneNumber);
                    var e = this.credential && this.credential.D();
                    return e && ct(t, e), t
                }, Gr.prototype.toJSON = function () {
                    return this.D()
                };
                var Xr, zr = /^[+a-zA-Z0-9_.!#$%&'*\/=?^`{|}~-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,63}$/;

                function Jr() {}

                function Yr(t) {
                    return t.c || (t.c = t.b())
                }

                function $r() {}

                function Zr(t) {
                    if (!t.f && "undefined" == typeof XMLHttpRequest && "undefined" != typeof ActiveXObject) {
                        for (var e = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"], n = 0; n < e.length; n++) {
                            var i = e[n];
                            try {
                                return new ActiveXObject(i), t.f = i
                            } catch (t) {}
                        }
                        throw Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed")
                    }
                    return t.f
                }

                function Qr() {}

                function to() {
                    this.a = new XDomainRequest, this.readyState = 0, this.onreadystatechange = null, this.responseText = "", this.status = -1, this.statusText = "", this.a.onload = g(this.bc, this), this.a.onerror = g(this.Bb, this), this.a.onprogress = g(this.cc, this), this.a.ontimeout = g(this.fc, this)
                }

                function eo(t, e) {
                    t.readyState = e, t.onreadystatechange && t.onreadystatechange()
                }

                function no(t, e, n) {
                    this.reset(t, e, n, void 0, void 0)
                }

                function io(t) {
                    this.f = t, this.b = this.c = this.a = null
                }

                function ro(t, e) {
                    this.name = t, this.value = e
                }
                Jr.prototype.c = null, w($r, Jr), $r.prototype.a = function () {
                    var t = Zr(this);
                    return t ? new ActiveXObject(t) : new XMLHttpRequest
                }, $r.prototype.b = function () {
                    var t = {};
                    return Zr(this) && (t[0] = !0, t[1] = !0), t
                }, Xr = new $r, w(Qr, Jr), Qr.prototype.a = function () {
                    var t = new XMLHttpRequest;
                    if ("withCredentials" in t) return t;
                    if ("undefined" != typeof XDomainRequest) return new to;
                    throw Error("Unsupported browser")
                }, Qr.prototype.b = function () {
                    return {}
                }, (t = to.prototype).open = function (t, e, n) {
                    if (null != n && !n) throw Error("Only async requests are supported.");
                    this.a.open(t, e)
                }, t.send = function (t) {
                    if (t) {
                        if ("string" != typeof t) throw Error("Only string data is supported");
                        this.a.send(t)
                    } else this.a.send()
                }, t.abort = function () {
                    this.a.abort()
                }, t.setRequestHeader = function () {}, t.getResponseHeader = function (t) {
                    return "content-type" == t.toLowerCase() ? this.a.contentType : ""
                }, t.bc = function () {
                    this.status = 200, this.responseText = this.a.responseText, eo(this, 4)
                }, t.Bb = function () {
                    this.status = 500, this.responseText = "", eo(this, 4)
                }, t.fc = function () {
                    this.Bb()
                }, t.cc = function () {
                    this.status = 200, eo(this, 1)
                }, t.getAllResponseHeaders = function () {
                    return "content-type: " + this.a.contentType
                }, no.prototype.a = null, no.prototype.reset = function (t, e, n, i, r) {
                    delete this.a
                }, ro.prototype.toString = function () {
                    return this.name
                };
                var oo = new ro("SEVERE", 1e3),
                    ao = new ro("WARNING", 900),
                    so = new ro("CONFIG", 700),
                    uo = new ro("FINE", 500);
                io.prototype.log = function (t, e, n) {
                    if (t.value >= function t(e) {
                            return e.c ? e.c : e.a ? t(e.a) : (S("Root logger has no level set."), null)
                        }(this).value)
                        for (f(e) && (e = e()), t = new no(t, String(e), this.f), n && (t.a = n), n = this; n;) n = n.a
                };
                var co = {},
                    ho = null;

                function fo(t) {
                    var e;
                    if (ho || (ho = new io(""), co[""] = ho, ho.c = so), !(e = co[t])) {
                        e = new io(t);
                        var n = t.lastIndexOf("."),
                            i = t.substr(n + 1);
                        (n = fo(t.substr(0, n))).b || (n.b = {}), n.b[i] = e, e.a = n, co[t] = e
                    }
                    return e
                }

                function lo(t, e) {
                    t && t.log(uo, e, void 0)
                }

                function po(t) {
                    this.f = t
                }

                function vo(t) {
                    Oe.call(this), this.i = t, this.readyState = mo, this.status = 0, this.responseText = this.statusText = "", this.onreadystatechange = null, this.g = new Headers, this.b = null, this.h = "GET", this.c = "", this.a = !1, this.f = fo("goog.net.FetchXmlHttp")
                }
                w(po, Jr), po.prototype.a = function () {
                    return new vo(this.f)
                }, po.prototype.b = function (t) {
                    return function () {
                        return t
                    }
                }({}), w(vo, Oe);
                var mo = 0;

                function go(t) {
                    t.onreadystatechange && t.onreadystatechange.call(t)
                }

                function bo(t) {
                    Oe.call(this), this.headers = new je, this.C = t || null, this.c = !1, this.w = this.a = null, this.h = this.N = this.l = "", this.f = this.I = this.i = this.G = !1, this.g = 0, this.u = null, this.o = yo, this.v = this.O = !1
                }(t = vo.prototype).open = function (t, e) {
                    if (this.readyState != mo) throw this.abort(), Error("Error reopening a connection");
                    this.h = t, this.c = e, this.readyState = 1, go(this)
                }, t.send = function (t) {
                    if (1 != this.readyState) throw this.abort(), Error("need to call open() first. ");
                    this.a = !0;
                    var e = {
                        headers: this.g,
                        method: this.h,
                        credentials: void 0,
                        cache: void 0
                    };
                    t && (e.body = t), this.i.fetch(new Request(this.c, e)).then(this.ec.bind(this), this.Cb.bind(this))
                }, t.abort = function () {
                    this.responseText = "", this.g = new Headers, this.status = 0, 1 <= this.readyState && this.a && 4 != this.readyState && (this.readyState = 4, this.a = !1, go(this)), this.readyState = mo
                }, t.ec = function (t) {
                    this.a && (this.b || (this.b = t.headers, this.readyState = 2, go(this)), this.a && (this.readyState = 3, go(this), this.a && t.text().then(this.dc.bind(this, t), this.Cb.bind(this))))
                }, t.dc = function (t, e) {
                    this.a && (this.status = t.status, this.statusText = t.statusText, this.responseText = e, this.readyState = 4, go(this))
                }, t.Cb = function (t) {
                    var e = this.f;
                    e && e.log(ao, "Failed to fetch url " + this.c, t instanceof Error ? t : Error(t)), this.a && (this.readyState = 4, go(this))
                }, t.setRequestHeader = function (t, e) {
                    this.g.append(t, e)
                }, t.getResponseHeader = function (t) {
                    return this.b ? this.b.get(t.toLowerCase()) || "" : ((t = this.f) && t.log(ao, "Attempting to get response header but no headers have been received for url: " + this.c, void 0), "")
                }, t.getAllResponseHeaders = function () {
                    if (!this.b) {
                        var t = this.f;
                        return t && t.log(ao, "Attempting to get all response headers but no headers have been received for url: " + this.c, void 0), ""
                    }
                    t = [];
                    for (var e = this.b.entries(), n = e.next(); !n.done;) n = n.value, t.push(n[0] + ": " + n[1]), n = e.next();
                    return t.join("\r\n")
                }, w(bo, Oe);
                var yo = "";
                bo.prototype.b = fo("goog.net.XhrIo");
                var wo = /^https?$/i,
                    Io = ["POST", "PUT"];

                function To(t, e, n, o, a) {
                    if (t.a) throw Error("[goog.net.XhrIo] Object is active with another request=" + t.l + "; newUri=" + e);
                    n = n ? n.toUpperCase() : "GET", t.l = e, t.h = "", t.N = n, t.G = !1, t.c = !0, t.a = t.C ? t.C.a() : Xr.a(), t.w = t.C ? Yr(t.C) : Yr(Xr), t.a.onreadystatechange = g(t.Fb, t);
                    try {
                        lo(t.b, Ro(t, "Opening Xhr")), t.I = !0, t.a.open(n, String(e), !0), t.I = !1
                    } catch (e) {
                        return lo(t.b, Ro(t, "Error opening Xhr: " + e.message)), void Eo(t, e)
                    }
                    e = o || "";
                    var s = new je(t.headers);
                    a && function (t, e) {
                        if (t.forEach && "function" == typeof t.forEach) t.forEach(e, void 0);
                        else if (h(t) || r(t)) D(t, e, void 0);
                        else
                            for (var n = Me(t), i = xe(t), o = i.length, a = 0; a < o; a++) e.call(void 0, i[a], n && n[a], t)
                    }(a, function (t, e) {
                        s.set(e, t)
                    }), a = function (t) {
                        t: {
                            for (var e = Ao, n = t.length, i = r(t) ? t.split("") : t, o = 0; o < n; o++)
                                if (o in i && e.call(void 0, i[o], o, t)) {
                                    e = o;
                                    break t
                                }
                            e = -1
                        }
                        return 0 > e ? null : r(t) ? t.charAt(e) : t[e]
                    }(s.U()), o = i.FormData && e instanceof i.FormData, !M(Io, n) || a || o || s.set("Content-Type", "application/x-www-form-urlencoded;charset=utf-8"), s.forEach(function (t, e) {
                        this.a.setRequestHeader(e, t)
                    }, t), t.o && (t.a.responseType = t.o), "withCredentials" in t.a && t.a.withCredentials !== t.O && (t.a.withCredentials = t.O);
                    try {
                        _o(t), 0 < t.g && (t.v = function (t) {
                            return qt && te(9) && "number" == typeof t.timeout && void 0 !== t.ontimeout
                        }(t.a), lo(t.b, Ro(t, "Will abort after " + t.g + "ms if incomplete, xhr2 " + t.v)), t.v ? (t.a.timeout = t.g, t.a.ontimeout = g(t.Ga, t)) : t.u = De(t.Ga, t.g, t)), lo(t.b, Ro(t, "Sending request")), t.i = !0, t.a.send(e), t.i = !1
                    } catch (e) {
                        lo(t.b, Ro(t, "Send error: " + e.message)), Eo(t, e)
                    }
                }

                function Ao(t) {
                    return "content-type" == t.toLowerCase()
                }

                function Eo(t, e) {
                    t.c = !1, t.a && (t.f = !0, t.a.abort(), t.f = !1), t.h = e, So(t), No(t)
                }

                function So(t) {
                    t.G || (t.G = !0, t.dispatchEvent("complete"), t.dispatchEvent("error"))
                }

                function ko(t) {
                    if (t.c && void 0 !== n)
                        if (t.w[1] && 4 == Oo(t) && 2 == Po(t)) lo(t.b, Ro(t, "Local request error detected and ignored"));
                        else if (t.i && 4 == Oo(t)) De(t.Fb, 0, t);
                    else if (t.dispatchEvent("readystatechange"), 4 == Oo(t)) {
                        lo(t.b, Ro(t, "Request complete")), t.c = !1;
                        try {
                            var e, r = Po(t);
                            t: switch (r) {
                                case 200:
                                case 201:
                                case 202:
                                case 204:
                                case 206:
                                case 304:
                                case 1223:
                                    var o = !0;
                                    break t;
                                default:
                                    o = !1
                            }
                            if (!(e = o)) {
                                var a;
                                if (a = 0 === r) {
                                    var s = String(t.l).match(Fe)[1] || null;
                                    if (!s && i.self && i.self.location) {
                                        var u = i.self.location.protocol;
                                        s = u.substr(0, u.length - 1)
                                    }
                                    a = !wo.test(s ? s.toLowerCase() : "")
                                }
                                e = a
                            }
                            if (e) t.dispatchEvent("complete"), t.dispatchEvent("success");
                            else {
                                try {
                                    var c = 2 < Oo(t) ? t.a.statusText : ""
                                } catch (e) {
                                    lo(t.b, "Can not get status: " + e.message), c = ""
                                }
                                t.h = c + " [" + Po(t) + "]", So(t)
                            }
                        } finally {
                            No(t)
                        }
                    }
                }

                function No(t, e) {
                    if (t.a) {
                        _o(t);
                        var n = t.a,
                            i = t.w[0] ? a : null;
                        t.a = null, t.w = null, e || t.dispatchEvent("ready");
                        try {
                            n.onreadystatechange = i
                        } catch (e) {
                            (t = t.b) && t.log(oo, "Problem encountered resetting onreadystatechange: " + e.message, void 0)
                        }
                    }
                }

                function _o(t) {
                    t.a && t.v && (t.a.ontimeout = null), t.u && (i.clearTimeout(t.u), t.u = null)
                }

                function Oo(t) {
                    return t.a ? t.a.readyState : 0
                }

                function Po(t) {
                    try {
                        return 2 < Oo(t) ? t.a.status : -1
                    } catch (t) {
                        return -1
                    }
                }

                function Ro(t, e) {
                    return e + " [" + t.N + " " + t.l + " " + Po(t) + "]"
                }

                function Co(t, e) {
                    this.g = [], this.v = t, this.u = e || null, this.f = this.a = !1, this.c = void 0, this.l = this.w = this.i = !1, this.h = 0, this.b = null, this.m = 0
                }

                function Do(t, e, n) {
                    t.a = !0, t.c = n, t.f = !e, jo(t)
                }

                function Lo(t) {
                    if (t.a) {
                        if (!t.l) throw new Uo(t);
                        t.l = !1
                    }
                }

                function xo(t, e, n, i) {
                    t.g.push([e, n, i]), t.a && jo(t)
                }

                function Mo(t) {
                    return x(t.g, function (t) {
                        return f(t[1])
                    })
                }

                function jo(t) {
                    if (t.h && t.a && Mo(t)) {
                        var e = t.h,
                            n = Ko[e];
                        n && (i.clearTimeout(n.a), delete Ko[e]), t.h = 0
                    }
                    t.b && (t.b.m--, delete t.b), e = t.c;
                    for (var r = n = !1; t.g.length && !t.i;) {
                        var o = t.g.shift(),
                            a = o[0],
                            s = o[1];
                        if (o = o[2], a = t.f ? s : a) try {
                            var u = a.call(o || t.u, e);
                            void 0 !== u && (t.f = t.f && (u == e || u instanceof Error), t.c = e = u), (T(e) || "function" == typeof i.Promise && e instanceof i.Promise) && (r = !0, t.i = !0)
                        } catch (i) {
                            e = i, t.f = !0, Mo(t) || (n = !0)
                        }
                    }
                    t.c = e, r && (u = g(t.o, t, !0), r = g(t.o, t, !1), e instanceof Co ? (xo(e, u, r), e.w = !0) : e.then(u, r)), n && (e = new Fo(e), Ko[e.a] = e, t.h = e.a)
                }

                function Uo() {
                    A.call(this)
                }

                function Vo() {
                    A.call(this)
                }

                function Fo(t) {
                    this.a = i.setTimeout(g(this.c, this), 0), this.b = t
                }(t = bo.prototype).Ga = function () {
                    void 0 !== n && this.a && (this.h = "Timed out after " + this.g + "ms, aborting", lo(this.b, Ro(this, this.h)), this.dispatchEvent("timeout"), this.abort(8))
                }, t.abort = function () {
                    this.a && this.c && (lo(this.b, Ro(this, "Aborting")), this.c = !1, this.f = !0, this.a.abort(), this.f = !1, this.dispatchEvent("complete"), this.dispatchEvent("abort"), No(this))
                }, t.ua = function () {
                    this.a && (this.c && (this.c = !1, this.f = !0, this.a.abort(), this.f = !1), No(this, !0)), bo.lb.ua.call(this)
                }, t.Fb = function () {
                    this.pa || (this.I || this.i || this.f ? ko(this) : this.tc())
                }, t.tc = function () {
                    ko(this)
                }, t.getResponse = function () {
                    try {
                        if (!this.a) return null;
                        if ("response" in this.a) return this.a.response;
                        switch (this.o) {
                            case yo:
                            case "text":
                                return this.a.responseText;
                            case "arraybuffer":
                                if ("mozResponseArrayBuffer" in this.a) return this.a.mozResponseArrayBuffer
                        }
                        var t = this.b;
                        return t && t.log(oo, "Response type " + this.o + " is not supported on this browser", void 0), null
                    } catch (t) {
                        return lo(this.b, "Can not get response: " + t.message), null
                    }
                }, Co.prototype.cancel = function (t) {
                    if (this.a) this.c instanceof Co && this.c.cancel();
                    else {
                        if (this.b) {
                            var e = this.b;
                            delete this.b, t ? e.cancel(t) : (e.m--, 0 >= e.m && e.cancel())
                        }
                        this.v ? this.v.call(this.u, this) : this.l = !0, this.a || (t = new Vo(this), Lo(this), Do(this, !1, t))
                    }
                }, Co.prototype.o = function (t, e) {
                    this.i = !1, Do(this, t, e)
                }, Co.prototype.C = function () {
                    Lo(this), Do(this, !0, null)
                }, Co.prototype.then = function (t, e, n) {
                    var i, r, o = new vt(function (t, e) {
                        i = t, r = e
                    });
                    return xo(this, i, function (t) {
                        t instanceof Vo ? o.cancel() : r(t)
                    }), o.then(t, e, n)
                }, I(Co), w(Uo, A), Uo.prototype.message = "Deferred has already fired", Uo.prototype.name = "AlreadyCalledError", w(Vo, A), Vo.prototype.message = "Deferred was canceled", Vo.prototype.name = "CanceledError", Fo.prototype.c = function () {
                    throw delete Ko[this.a], this.b
                };
                var Ko = {};

                function Ho(t) {
                    var e = {},
                        n = e.document || document,
                        i = gn(t),
                        r = document.createElement("SCRIPT"),
                        o = {
                            Hb: r,
                            Ga: void 0
                        },
                        a = new Co(qo, o),
                        s = null,
                        u = null != e.timeout ? e.timeout : 5e3;
                    return 0 < u && (s = window.setTimeout(function () {
                            Wo(r, !0);
                            var t = new Xo(Bo, "Timeout reached for loading script " + i);
                            Lo(a), Do(a, !1, t)
                        }, u), o.Ga = s), r.onload = r.onreadystatechange = function () {
                            r.readyState && "loaded" != r.readyState && "complete" != r.readyState || (Wo(r, e.dd || !1, s), a.C())
                        }, r.onerror = function () {
                            Wo(r, !0, s);
                            var t = new Xo(Go, "Error while loading script " + i);
                            Lo(a), Do(a, !1, t)
                        }, ct(o = e.attributes || {}, {
                            type: "text/javascript",
                            charset: "UTF-8"
                        }), Cn(r, o), r.src = gn(t),
                        function (t) {
                            var e;
                            return (e = (t || document).getElementsByTagName("HEAD")) && 0 != e.length ? e[0] : t.documentElement
                        }(n).appendChild(r), a
                }

                function qo() {
                    if (this && this.Hb) {
                        var t = this.Hb;
                        t && "SCRIPT" == t.tagName && Wo(t, !0, this.Ga)
                    }
                }

                function Wo(t, e, n) {
                    null != n && i.clearTimeout(n), t.onload = a, t.onerror = a, t.onreadystatechange = a, e && window.setTimeout(function () {
                        t && t.parentNode && t.parentNode.removeChild(t)
                    }, 0)
                }
                var Go = 0,
                    Bo = 1;

                function Xo(t, e) {
                    var n = "Jsloader error (code #" + t + ")";
                    e && (n += ": " + e), A.call(this, n), this.code = t
                }

                function zo(t) {
                    this.f = t
                }

                function Jo(t, n, r) {
                    if (this.b = t, t = n || {}, this.i = t.secureTokenEndpoint || "https://securetoken.googleapis.com/v1/token", this.m = t.secureTokenTimeout || Zo, this.f = ot(t.secureTokenHeaders || Qo), this.g = t.firebaseEndpoint || "https://www.googleapis.com/identitytoolkit/v3/relyingparty/", this.h = t.firebaseTimeout || ta, this.a = ot(t.firebaseHeaders || ea), r && (this.a["X-Client-Version"] = r, this.f["X-Client-Version"] = r), r = "Node" == $n(), !(r = i.XMLHttpRequest || r && e.INTERNAL.node && e.INTERNAL.node.XMLHttpRequest) && !Yn()) throw new ji("internal-error", "The XMLHttpRequest compatibility library was not found.");
                    this.c = void 0, Yn() ? this.c = new po(self) : Zn() ? this.c = new zo(r) : this.c = new Qr
                }
                w(Xo, A), w(zo, Jr), zo.prototype.a = function () {
                    return new this.f
                }, zo.prototype.b = function () {
                    return {}
                };
                var Yo, $o = "idToken",
                    Zo = new gi(3e4, 6e4),
                    Qo = {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    ta = new gi(3e4, 6e4),
                    ea = {
                        "Content-Type": "application/json"
                    };

                function na(t, e) {
                    e ? t.a["X-Firebase-Locale"] = e : delete t.a["X-Firebase-Locale"]
                }

                function ia(t, e) {
                    e ? (t.a["X-Client-Version"] = e, t.f["X-Client-Version"] = e) : (delete t.a["X-Client-Version"], delete t.f["X-Client-Version"])
                }

                function ra(t, e, n, r, o, a, s) {
                    (function () {
                        var t = ri();
                        return !((t = ei(t) != ti ? null : (t = t.match(/\sChrome\/(\d+)/i)) && 2 == t.length ? parseInt(t[1], 10) : null) && 30 > t || qt && Zt && !(9 < Zt))
                    })() || Yn() ? t = g(t.o, t) : (Yo || (Yo = new vt(function (t, e) {
                        ! function (t, e) {
                            if (((window.gapi || {}).client || {}).request) t();
                            else {
                                i[aa] = function () {
                                    ((window.gapi || {}).client || {}).request ? t() : e(Error("CORS_UNSUPPORTED"))
                                };
                                var n = bn(oa, {
                                    onload: aa
                                });
                                ! function (t, e) {
                                    xo(t, null, e, void 0)
                                }(Ho(n), function () {
                                    e(Error("CORS_UNSUPPORTED"))
                                })
                            }
                        }(t, e)
                    })), t = g(t.l, t)), t(e, n, r, o, a, s)
                }
                Jo.prototype.o = function (t, e, n, r, o, a) {
                    if (Yn() && (void 0 === i.fetch || void 0 === i.Headers || void 0 === i.Request)) throw new ji("operation-not-supported-in-this-environment", "fetch, Headers and Request native APIs or equivalent Polyfills must be available to support HTTP requests from a Worker environment.");
                    var s = new bo(this.c);
                    if (a) {
                        s.g = Math.max(0, a);
                        var u = setTimeout(function () {
                            s.dispatchEvent("timeout")
                        }, a)
                    }
                    Pe(s, "complete", function () {
                        u && clearTimeout(u);
                        var t = null;
                        try {
                            t = JSON.parse(function (t) {
                                try {
                                    return t.a ? t.a.responseText : ""
                                } catch (e) {
                                    return lo(t.b, "Can not get responseText: " + e.message), ""
                                }
                            }(this)) || null
                        } catch (e) {
                            t = null
                        }
                        e && e(t)
                    }), Re(s, "ready", function () {
                        u && clearTimeout(u), Ut(this)
                    }), Re(s, "timeout", function () {
                        u && clearTimeout(u), Ut(this), e && e(null)
                    }), To(s, t, n, r, o)
                };
                var oa = vn("https://apis.google.com/js/client.js?onload=%{onload}"),
                    aa = "__fcb" + Math.floor(1e6 * Math.random()).toString();

                function sa(t) {
                    if (!zr.test(t.email)) throw new ji("invalid-email")
                }

                function ua(t) {
                    "email" in t && sa(t)
                }

                function ca(t) {
                    if (!t[$o]) throw new ji("internal-error")
                }

                function ha(t) {
                    if (t.phoneNumber || t.temporaryProof) {
                        if (!t.phoneNumber || !t.temporaryProof) throw new ji("internal-error")
                    } else {
                        if (!t.sessionInfo) throw new ji("missing-verification-id");
                        if (!t.code) throw new ji("missing-verification-code")
                    }
                }
                Jo.prototype.l = function (t, e, n, i, r) {
                    var o = this;
                    Yo.then(function () {
                        window.gapi.client.setApiKey(o.b);
                        var a = window.gapi.auth.getToken();
                        window.gapi.auth.setToken(null), window.gapi.client.request({
                            path: t,
                            method: n,
                            body: i,
                            headers: r,
                            authType: "none",
                            callback: function (t) {
                                window.gapi.auth.setToken(a), e && e(t)
                            }
                        })
                    }).s(function (t) {
                        e && e({
                            error: {
                                message: t && t.message || "CORS_UNSUPPORTED"
                            }
                        })
                    })
                }, Jo.prototype.Pa = function () {
                    return Ga(this, Ma, {})
                }, Jo.prototype.mb = function (t, e) {
                    return Ga(this, La, {
                        idToken: t,
                        email: e
                    })
                }, Jo.prototype.nb = function (t, e) {
                    return Ga(this, xa, {
                        idToken: t,
                        password: e
                    })
                };
                var fa = {
                    displayName: "DISPLAY_NAME",
                    photoUrl: "PHOTO_URL"
                };

                function la(t) {
                    if (!t.requestUri || !t.sessionId && !t.postBody) throw new ji("internal-error")
                }

                function da(t) {
                    var e = null;
                    if (t.needConfirmation ? (t.code = "account-exists-with-different-credential", e = Br(t)) : "FEDERATED_USER_ID_ALREADY_LINKED" == t.errorMessage ? (t.code = "credential-already-in-use", e = Br(t)) : "EMAIL_EXISTS" == t.errorMessage ? (t.code = "email-already-in-use", e = Br(t)) : t.errorMessage && (e = Ba(t.errorMessage)), e) throw e;
                    if (!t[$o]) throw new ji("internal-error")
                }

                function pa(t, e) {
                    return e.returnIdpCredential = !0, Ga(t, ja, e)
                }

                function va(t, e) {
                    return e.returnIdpCredential = !0, Ga(t, Va, e)
                }

                function ma(t, e) {
                    return e.returnIdpCredential = !0, e.autoCreate = !1, Ga(t, Ua, e)
                }

                function ga(t) {
                    if (!t.oobCode) throw new ji("invalid-action-code")
                }(t = Jo.prototype).ob = function (t, e) {
                    var n = {
                            idToken: t
                        },
                        i = [];
                    return it(fa, function (t, r) {
                        var o = e[r];
                        null === o ? i.push(t) : r in e && (n[r] = o)
                    }), i.length && (n.deleteAttribute = i), Ga(this, La, n)
                }, t.hb = function (t, e) {
                    return ct(t = {
                        requestType: "PASSWORD_RESET",
                        email: t
                    }, e), Ga(this, Oa, t)
                }, t.ib = function (t, e) {
                    return ct(t = {
                        requestType: "EMAIL_SIGNIN",
                        email: t
                    }, e), Ga(this, Na, t)
                }, t.gb = function (t, e) {
                    return ct(t = {
                        requestType: "VERIFY_EMAIL",
                        idToken: t
                    }, e), Ga(this, _a, t)
                }, t.Ta = function (t) {
                    return Ga(this, Ha, t)
                }, t.Xa = function (t, e) {
                    return Ga(this, Ca, {
                        oobCode: t,
                        newPassword: e
                    })
                }, t.Ja = function (t) {
                    return Ga(this, ya, {
                        oobCode: t
                    })
                }, t.Va = function (t) {
                    return Ga(this, ba, {
                        oobCode: t
                    })
                };
                var ba = {
                        endpoint: "setAccountInfo",
                        B: ga,
                        da: "email"
                    },
                    ya = {
                        endpoint: "resetPassword",
                        B: ga,
                        J: function (t) {
                            var e = t.requestType;
                            if (!e || !t.email && "EMAIL_SIGNIN" != e) throw new ji("internal-error")
                        }
                    },
                    wa = {
                        endpoint: "signupNewUser",
                        B: function (t) {
                            if (sa(t), !t.password) throw new ji("weak-password")
                        },
                        J: ca,
                        R: !0
                    },
                    Ia = {
                        endpoint: "createAuthUri"
                    },
                    Ta = {
                        endpoint: "deleteAccount",
                        T: ["idToken"]
                    },
                    Aa = {
                        endpoint: "setAccountInfo",
                        T: ["idToken", "deleteProvider"],
                        B: function (t) {
                            if (!c(t.deleteProvider)) throw new ji("internal-error")
                        }
                    },
                    Ea = {
                        endpoint: "emailLinkSignin",
                        T: ["email", "oobCode"],
                        B: sa,
                        J: ca,
                        R: !0
                    },
                    Sa = {
                        endpoint: "emailLinkSignin",
                        T: ["idToken", "email", "oobCode"],
                        B: sa,
                        J: ca,
                        R: !0
                    },
                    ka = {
                        endpoint: "getAccountInfo"
                    },
                    Na = {
                        endpoint: "getOobConfirmationCode",
                        T: ["requestType"],
                        B: function (t) {
                            if ("EMAIL_SIGNIN" != t.requestType) throw new ji("internal-error");
                            sa(t)
                        },
                        da: "email"
                    },
                    _a = {
                        endpoint: "getOobConfirmationCode",
                        T: ["idToken", "requestType"],
                        B: function (t) {
                            if ("VERIFY_EMAIL" != t.requestType) throw new ji("internal-error")
                        },
                        da: "email"
                    },
                    Oa = {
                        endpoint: "getOobConfirmationCode",
                        T: ["requestType"],
                        B: function (t) {
                            if ("PASSWORD_RESET" != t.requestType) throw new ji("internal-error");
                            sa(t)
                        },
                        da: "email"
                    },
                    Pa = {
                        rb: !0,
                        endpoint: "getProjectConfig",
                        Eb: "GET"
                    },
                    Ra = {
                        rb: !0,
                        endpoint: "getRecaptchaParam",
                        Eb: "GET",
                        J: function (t) {
                            if (!t.recaptchaSiteKey) throw new ji("internal-error")
                        }
                    },
                    Ca = {
                        endpoint: "resetPassword",
                        B: ga,
                        da: "email"
                    },
                    Da = {
                        endpoint: "sendVerificationCode",
                        T: ["phoneNumber", "recaptchaToken"],
                        da: "sessionInfo"
                    },
                    La = {
                        endpoint: "setAccountInfo",
                        T: ["idToken"],
                        B: ua,
                        R: !0
                    },
                    xa = {
                        endpoint: "setAccountInfo",
                        T: ["idToken"],
                        B: function (t) {
                            if (ua(t), !t.password) throw new ji("weak-password")
                        },
                        J: ca,
                        R: !0
                    },
                    Ma = {
                        endpoint: "signupNewUser",
                        J: ca,
                        R: !0
                    },
                    ja = {
                        endpoint: "verifyAssertion",
                        B: la,
                        J: da,
                        R: !0
                    },
                    Ua = {
                        endpoint: "verifyAssertion",
                        B: la,
                        J: function (t) {
                            if (t.errorMessage && "USER_NOT_FOUND" == t.errorMessage) throw new ji("user-not-found");
                            if (t.errorMessage) throw Ba(t.errorMessage);
                            if (!t[$o]) throw new ji("internal-error")
                        },
                        R: !0
                    },
                    Va = {
                        endpoint: "verifyAssertion",
                        B: function (t) {
                            if (la(t), !t.idToken) throw new ji("internal-error")
                        },
                        J: da,
                        R: !0
                    },
                    Fa = {
                        endpoint: "verifyCustomToken",
                        B: function (t) {
                            if (!t.token) throw new ji("invalid-custom-token")
                        },
                        J: ca,
                        R: !0
                    },
                    Ka = {
                        endpoint: "verifyPassword",
                        B: function (t) {
                            if (sa(t), !t.password) throw new ji("wrong-password")
                        },
                        J: ca,
                        R: !0
                    },
                    Ha = {
                        endpoint: "verifyPhoneNumber",
                        B: ha,
                        J: ca
                    },
                    qa = {
                        endpoint: "verifyPhoneNumber",
                        B: function (t) {
                            if (!t.idToken) throw new ji("internal-error");
                            ha(t)
                        },
                        J: function (t) {
                            if (t.temporaryProof) throw t.code = "credential-already-in-use", Br(t);
                            ca(t)
                        }
                    },
                    Wa = {
                        Tb: {
                            USER_NOT_FOUND: "user-not-found"
                        },
                        endpoint: "verifyPhoneNumber",
                        B: ha,
                        J: ca
                    };

                function Ga(t, e, n) {
                    if (! function (t, e) {
                            if (!e || !e.length) return !0;
                            if (!t) return !1;
                            for (var n = 0; n < e.length; n++) {
                                var i = t[e[n]];
                                if (void 0 === i || null === i || "" === i) return !1
                            }
                            return !0
                        }(n, e.T)) return At(new ji("internal-error"));
                    var i, r = e.Eb || "POST";
                    return Tt(n).then(e.B).then(function () {
                        return e.R && (n.returnSecureToken = !0),
                            function (t, e, n, i, r, o) {
                                var a = Xe(t.g + e);
                                Ge(a, "key", t.b), o && Ge(a, "cb", y().toString());
                                var s = "GET" == n;
                                if (s)
                                    for (var u in i) i.hasOwnProperty(u) && Ge(a, u, i[u]);
                                return new vt(function (e, o) {
                                    ra(t, a.toString(), function (t) {
                                        t ? t.error ? o(Xa(t, r || {})) : e(t) : o(new ji("network-request-failed"))
                                    }, n, s ? void 0 : Mn(li(i)), t.a, t.h.get())
                                })
                            }(t, e.endpoint, r, n, e.Tb, e.rb || !1)
                    }).then(function (t) {
                        return i = t
                    }).then(e.J).then(function () {
                        if (!e.da) return i;
                        if (!(e.da in i)) throw new ji("internal-error");
                        return i[e.da]
                    })
                }

                function Ba(t) {
                    return Xa({
                        error: {
                            errors: [{
                                message: t
                            }],
                            code: 400,
                            message: t
                        }
                    })
                }

                function Xa(t, e) {
                    var n = (t.error && t.error.errors && t.error.errors[0] || {}).reason || "",
                        i = {
                            keyInvalid: "invalid-api-key",
                            ipRefererBlocked: "app-not-authorized"
                        };
                    if (n = i[n] ? new ji(i[n]) : null) return n;
                    for (var r in n = t.error && t.error.message || "", ct(i = {
                            INVALID_CUSTOM_TOKEN: "invalid-custom-token",
                            CREDENTIAL_MISMATCH: "custom-token-mismatch",
                            MISSING_CUSTOM_TOKEN: "internal-error",
                            INVALID_IDENTIFIER: "invalid-email",
                            MISSING_CONTINUE_URI: "internal-error",
                            INVALID_EMAIL: "invalid-email",
                            INVALID_PASSWORD: "wrong-password",
                            USER_DISABLED: "user-disabled",
                            MISSING_PASSWORD: "internal-error",
                            EMAIL_EXISTS: "email-already-in-use",
                            PASSWORD_LOGIN_DISABLED: "operation-not-allowed",
                            INVALID_IDP_RESPONSE: "invalid-credential",
                            FEDERATED_USER_ID_ALREADY_LINKED: "credential-already-in-use",
                            INVALID_MESSAGE_PAYLOAD: "invalid-message-payload",
                            INVALID_RECIPIENT_EMAIL: "invalid-recipient-email",
                            INVALID_SENDER: "invalid-sender",
                            EMAIL_NOT_FOUND: "user-not-found",
                            EXPIRED_OOB_CODE: "expired-action-code",
                            INVALID_OOB_CODE: "invalid-action-code",
                            MISSING_OOB_CODE: "internal-error",
                            CREDENTIAL_TOO_OLD_LOGIN_AGAIN: "requires-recent-login",
                            INVALID_ID_TOKEN: "invalid-user-token",
                            TOKEN_EXPIRED: "user-token-expired",
                            USER_NOT_FOUND: "user-token-expired",
                            CORS_UNSUPPORTED: "cors-unsupported",
                            DYNAMIC_LINK_NOT_ACTIVATED: "dynamic-link-not-activated",
                            INVALID_APP_ID: "invalid-app-id",
                            TOO_MANY_ATTEMPTS_TRY_LATER: "too-many-requests",
                            WEAK_PASSWORD: "weak-password",
                            OPERATION_NOT_ALLOWED: "operation-not-allowed",
                            USER_CANCELLED: "user-cancelled",
                            CAPTCHA_CHECK_FAILED: "captcha-check-failed",
                            INVALID_APP_CREDENTIAL: "invalid-app-credential",
                            INVALID_CODE: "invalid-verification-code",
                            INVALID_PHONE_NUMBER: "invalid-phone-number",
                            INVALID_SESSION_INFO: "invalid-verification-id",
                            INVALID_TEMPORARY_PROOF: "invalid-credential",
                            MISSING_APP_CREDENTIAL: "missing-app-credential",
                            MISSING_CODE: "missing-verification-code",
                            MISSING_PHONE_NUMBER: "missing-phone-number",
                            MISSING_SESSION_INFO: "missing-verification-id",
                            QUOTA_EXCEEDED: "quota-exceeded",
                            SESSION_EXPIRED: "code-expired",
                            INVALID_CONTINUE_URI: "invalid-continue-uri",
                            MISSING_ANDROID_PACKAGE_NAME: "missing-android-pkg-name",
                            MISSING_IOS_BUNDLE_ID: "missing-ios-bundle-id",
                            UNAUTHORIZED_DOMAIN: "unauthorized-continue-uri",
                            INVALID_OAUTH_CLIENT_ID: "invalid-oauth-client-id",
                            INVALID_CERT_HASH: "invalid-cert-hash"
                        }, e || {}), e = (e = n.match(/^[^\s]+\s*:\s*(.*)$/)) && 1 < e.length ? e[1] : void 0, i)
                        if (0 === n.indexOf(r)) return new ji(i[r], e);
                    return !e && t && (e = fi(t)), new ji("internal-error", e)
                }
                var za, Ja = {
                    Yc: {
                        Za: "https://www.googleapis.com/identitytoolkit/v3/relyingparty/",
                        fb: "https://securetoken.googleapis.com/v1/token",
                        id: "p"
                    },
                    $c: {
                        Za: "https://staging-www.sandbox.googleapis.com/identitytoolkit/v3/relyingparty/",
                        fb: "https://staging-securetoken.sandbox.googleapis.com/v1/token",
                        id: "s"
                    },
                    ad: {
                        Za: "https://www-googleapis-test.sandbox.google.com/identitytoolkit/v3/relyingparty/",
                        fb: "https://test-securetoken.sandbox.googleapis.com/v1/token",
                        id: "t"
                    }
                };

                function Ya(t) {
                    for (var e in Ja)
                        if (Ja[e].id === t) return {
                            firebaseEndpoint: (t = Ja[e]).Za,
                            secureTokenEndpoint: t.fb
                        };
                    return null
                }

                function $a(t) {
                    this.b = t, this.a = null, this.bb = function (t) {
                        return (ns || (ns = new vt(function (t, e) {
                            function n() {
                                mi(), oi("gapi.load")("gapi.iframes", {
                                    callback: t,
                                    ontimeout: function () {
                                        mi(), e(Error("Network Error"))
                                    },
                                    timeout: ts.get()
                                })
                            }
                            if (oi("gapi.iframes.Iframe")) t();
                            else if (oi("gapi.load")) n();
                            else {
                                var r = "__iframefcb" + Math.floor(1e6 * Math.random()).toString();
                                i[r] = function () {
                                    oi("gapi.load") ? n() : e(Error("Network Error"))
                                }, Tt(Ho(r = bn(Qa, {
                                    onload: r
                                }))).s(function () {
                                    e(Error("Network Error"))
                                })
                            }
                        }).s(function (t) {
                            throw ns = null, t
                        }))).then(function () {
                            return new vt(function (e, n) {
                                oi("gapi.iframes.getContext")().open({
                                    where: document.body,
                                    url: t.b,
                                    messageHandlersFilter: oi("gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER"),
                                    attributes: {
                                        style: {
                                            position: "absolute",
                                            top: "-100px",
                                            width: "1px",
                                            height: "1px"
                                        }
                                    },
                                    dontclear: !0
                                }, function (i) {
                                    function r() {
                                        clearTimeout(o), e()
                                    }
                                    t.a = i, t.a.restyle({
                                        setHideOnLeave: !1
                                    });
                                    var o = setTimeout(function () {
                                        n(Error("Network Error"))
                                    }, es.get());
                                    i.ping(r).then(r, function () {
                                        n(Error("Network Error"))
                                    })
                                })
                            })
                        })
                    }(this)
                }
                za = Ya("__EID__") ? "__EID__" : void 0;
                var Za, Qa = vn("https://apis.google.com/js/api.js?onload=%{onload}"),
                    ts = new gi(3e4, 6e4),
                    es = new gi(5e3, 15e3),
                    ns = null;

                function is(t, e, n) {
                    this.i = t, this.g = e, this.h = n, this.f = null, this.a = ze(this.i, "/__/auth/iframe"), Ge(this.a, "apiKey", this.g), Ge(this.a, "appName", this.h), this.b = null, this.c = []
                }

                function rs(t, e, n, i, r) {
                    this.o = t, this.l = e, this.c = n, this.m = i, this.h = this.g = this.i = null, this.a = r, this.f = null
                }

                function os(t) {
                    try {
                        return e.app(t).auth().xa()
                    } catch (t) {
                        return []
                    }
                }

                function as(t, e, n, i, r) {
                    this.l = t, this.f = e, this.b = n, this.c = i || null, this.h = r || null, this.o = this.u = this.v = null, this.g = [], this.m = this.a = null
                }

                function ss(t) {
                    var e = Kn();
                    return function (t) {
                        return Ga(t, Pa, {}).then(function (t) {
                            return t.authorizedDomains || []
                        })
                    }(t).then(function (t) {
                        t: {
                            var n = Xe(e),
                                i = n.c;n = n.b;
                            for (var r = 0; r < t.length; r++) {
                                var o = t[r],
                                    a = n,
                                    s = i;
                                if (0 == o.indexOf("chrome-extension://") ? a = Xe(o).b == a && "chrome-extension" == s : "http" != s && "https" != s ? a = !1 : Bn.test(o) ? a = a == o : (o = o.split(".").join("\\."), a = new RegExp("^(.+\\." + o + "|" + o + ")$", "i").test(a)), a) {
                                    t = !0;
                                    break t
                                }
                            }
                            t = !1
                        }
                        if (!t) throw new Wr(Kn())
                    })
                }

                function us(t) {
                    return t.m ? t.m : (t.m = Xn().then(function () {
                        if (!t.u) {
                            var e = t.c,
                                n = t.h,
                                i = os(t.b),
                                r = new is(t.l, t.f, t.b);
                            r.f = e, r.b = n, r.c = F(i || []), t.u = r.toString()
                        }
                        t.i = new $a(t.u),
                            function (t) {
                                if (!t.i) throw Error("IfcHandler must be initialized!");
                                ! function (t, e) {
                                    t.bb.then(function () {
                                        t.a.register("authEvent", e, oi("gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER"))
                                    })
                                }(t.i, function (e) {
                                    var n = {};
                                    if (e && e.authEvent) {
                                        var i = !1;
                                        for (e = Kr(e.authEvent), n = 0; n < t.g.length; n++) i = t.g[n](e) || i;
                                        return (n = {}).status = i ? "ACK" : "ERROR", Tt(n)
                                    }
                                    return n.status = "ERROR", Tt(n)
                                })
                            }(t)
                    }), t.m)
                }

                function cs(t) {
                    return t.o || (t.v = t.c ? ii(t.c, os(t.b)) : null, t.o = new Jo(t.f, Ya(t.h), t.v)), t.o
                }

                function hs(t, e, n, i, r, o, a, s, u, c) {
                    return (t = new rs(t, e, n, i, r)).i = o, t.g = a, t.h = s, t.b = ot(u || null), t.f = c, t.toString()
                }

                function fs(t) {
                    if (this.a = t || e.INTERNAL.reactNative && e.INTERNAL.reactNative.AsyncStorage, !this.a) throw new ji("internal-error", "The React Native compatibility library was not found.");
                    this.type = "asyncStorage"
                }

                function ls() {
                    if (!vs()) throw new ji("web-storage-unsupported");
                    this.f = {}, this.a = [], this.b = 0, this.g = i.indexedDB, this.type = "indexedDB"
                }

                function ds(t) {
                    return new vt(function (e, n) {
                        var i = t.g.open("firebaseLocalStorageDb", 1);
                        i.onerror = function (t) {
                            try {
                                t.preventDefault()
                            } catch (t) {}
                            n(Error(t.target.error))
                        }, i.onupgradeneeded = function (t) {
                            t = t.target.result;
                            try {
                                t.createObjectStore("firebaseLocalStorage", {
                                    keyPath: "fbase_key"
                                })
                            } catch (t) {
                                n(t)
                            }
                        }, i.onsuccess = function (i) {
                            (i = i.target.result).objectStoreNames.contains("firebaseLocalStorage") ? e(i) : function (t) {
                                return new vt(function (e, n) {
                                    var i = t.g.deleteDatabase("firebaseLocalStorageDb");
                                    i.onsuccess = function () {
                                        e()
                                    }, i.onerror = function (t) {
                                        n(Error(t.target.error))
                                    }
                                })
                            }(t).then(function () {
                                return ds(t)
                            }).then(function (t) {
                                e(t)
                            }).s(function (t) {
                                n(t)
                            })
                        }
                    })
                }

                function ps(t) {
                    return t.h || (t.h = ds(t)), t.h
                }

                function vs() {
                    try {
                        return !!i.indexedDB
                    } catch (t) {
                        return !1
                    }
                }

                function ms(t) {
                    return t.objectStore("firebaseLocalStorage")
                }

                function gs(t, e) {
                    return t.transaction(["firebaseLocalStorage"], e ? "readwrite" : "readonly")
                }

                function bs(t) {
                    return new vt(function (e, n) {
                        t.onsuccess = function (t) {
                            t && t.target ? e(t.target.result) : e()
                        }, t.onerror = function (t) {
                            n(Error(t.target.errorCode))
                        }
                    })
                }

                function ys(t) {
                    var e = this,
                        n = null;
                    this.a = [], this.type = "indexedDB", this.c = t, this.b = Tt().then(function () {
                        if (vs()) {
                            var t = pi(),
                                i = "__sak" + t;
                            return Za || (Za = new ls), (n = Za).set(i, t).then(function () {
                                return n.get(i)
                            }).then(function (e) {
                                if (e !== t) throw Error("indexedDB not supported!");
                                return n.P(i)
                            }).then(function () {
                                return n
                            }).s(function () {
                                return e.c
                            })
                        }
                        return e.c
                    }).then(function (t) {
                        return e.type = t.type, t.Y(function (t) {
                            D(e.a, function (e) {
                                e(t)
                            })
                        }), t
                    })
                }

                function ws() {
                    this.a = {}, this.type = "inMemory"
                }

                function Is() {
                    if (! function () {
                            var t = "Node" == $n();
                            if (!(t = Ts() || t && e.INTERNAL.node && e.INTERNAL.node.localStorage)) return !1;
                            try {
                                return t.setItem("__sak", "1"), t.removeItem("__sak"), !0
                            } catch (t) {
                                return !1
                            }
                        }()) {
                        if ("Node" == $n()) throw new ji("internal-error", "The LocalStorage compatibility library was not found.");
                        throw new ji("web-storage-unsupported")
                    }
                    this.a = Ts() || e.INTERNAL.node.localStorage, this.type = "localStorage"
                }

                function Ts() {
                    try {
                        var t = i.localStorage,
                            e = pi();
                        return t && (t.setItem(e, "1"), t.removeItem(e)), t
                    } catch (t) {
                        return null
                    }
                }

                function As() {
                    this.type = "nullStorage"
                }

                function Es() {
                    if (! function () {
                            var t = "Node" == $n();
                            if (!(t = Ss() || t && e.INTERNAL.node && e.INTERNAL.node.sessionStorage)) return !1;
                            try {
                                return t.setItem("__sak", "1"), t.removeItem("__sak"), !0
                            } catch (t) {
                                return !1
                            }
                        }()) {
                        if ("Node" == $n()) throw new ji("internal-error", "The SessionStorage compatibility library was not found.");
                        throw new ji("web-storage-unsupported")
                    }
                    this.a = Ss() || e.INTERNAL.node.sessionStorage, this.type = "sessionStorage"
                }

                function Ss() {
                    try {
                        var t = i.sessionStorage,
                            e = pi();
                        return t && (t.setItem(e, "1"), t.removeItem(e)), t
                    } catch (t) {
                        return null
                    }
                }
                is.prototype.toString = function () {
                    return this.f ? Ge(this.a, "v", this.f) : sn(this.a.a, "v"), this.b ? Ge(this.a, "eid", this.b) : sn(this.a.a, "eid"), this.c.length ? Ge(this.a, "fw", this.c.join(",")) : sn(this.a.a, "fw"), this.a.toString()
                }, rs.prototype.toString = function () {
                    var t = ze(this.o, "/__/auth/handler");
                    if (Ge(t, "apiKey", this.l), Ge(t, "appName", this.c), Ge(t, "authType", this.m), this.a.isOAuthProvider) {
                        var n = this.a;
                        try {
                            var i = e.app(this.c).auth().ea()
                        } catch (t) {
                            i = null
                        }
                        for (var r in n.Ya = i, Ge(t, "providerId", this.a.providerId), i = li((n = this.a).vb)) i[r] = i[r].toString();
                        r = n.Ac, i = ot(i);
                        for (var o = 0; o < r.length; o++) {
                            var a = r[o];
                            a in i && delete i[a]
                        }
                        n.$a && n.Ya && !i[n.$a] && (i[n.$a] = n.Ya), rt(i) || Ge(t, "customParameters", fi(i))
                    }
                    if ("function" == typeof this.a.Ab && ((n = this.a.Ab()).length && Ge(t, "scopes", n.join(","))), this.i ? Ge(t, "redirectUrl", this.i) : sn(t.a, "redirectUrl"), this.g ? Ge(t, "eventId", this.g) : sn(t.a, "eventId"), this.h ? Ge(t, "v", this.h) : sn(t.a, "v"), this.b)
                        for (var s in this.b) this.b.hasOwnProperty(s) && !Be(t, s) && Ge(t, s, this.b[s]);
                    return this.f ? Ge(t, "eid", this.f) : sn(t.a, "eid"), (s = os(this.c)).length && Ge(t, "fw", s.join(",")), t.toString()
                }, (t = as.prototype).Ea = function (t, e, n) {
                    var i = new ji("popup-closed-by-user"),
                        r = new ji("web-storage-unsupported"),
                        o = this,
                        a = !1;
                    return this.ga().then(function () {
                        (function (t) {
                            var e = {
                                type: "webStorageSupport"
                            };
                            return us(t).then(function () {
                                return function (t, e) {
                                    return t.bb.then(function () {
                                        return new vt(function (n) {
                                            t.a.send(e.type, e, n, oi("gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER"))
                                        })
                                    })
                                }(t.i, e)
                            }).then(function (t) {
                                if (t && t.length && void 0 !== t[0].webStorageSupport) return t[0].webStorageSupport;
                                throw Error()
                            })
                        })(o).then(function (n) {
                            n || (t && Wn(t), e(r), a = !0)
                        })
                    }).s(function () {}).then(function () {
                        if (!a) return function (t) {
                            return new vt(function (e) {
                                return function n() {
                                    Le(2e3).then(function () {
                                        if (t && !t.closed) return n();
                                        e()
                                    })
                                }()
                            })
                        }(t)
                    }).then(function () {
                        if (!a) return Le(n).then(function () {
                            e(i)
                        })
                    })
                }, t.Ib = function () {
                    var t = ri();
                    return !hi(t) && !vi(t)
                }, t.Db = function () {
                    return !1
                }, t.zb = function (t, e, n, i, r, o, a) {
                    if (!t) return At(new ji("popup-blocked"));
                    if (a && !hi()) return this.ga().s(function (e) {
                        Wn(t), r(e)
                    }), i(), Tt();
                    this.a || (this.a = ss(cs(this)));
                    var s = this;
                    return this.a.then(function () {
                        var e = s.ga().s(function (e) {
                            throw Wn(t), r(e), e
                        });
                        return i(), e
                    }).then(function () {
                        (Vr(n), a) || Hn(hs(s.l, s.f, s.b, e, n, null, o, s.c, void 0, s.h), t)
                    }).s(function (t) {
                        throw "auth/network-request-failed" == t.code && (s.a = null), t
                    })
                }, t.Ca = function (t, e, n) {
                    this.a || (this.a = ss(cs(this)));
                    var i = this;
                    return this.a.then(function () {
                        Vr(e), Hn(hs(i.l, i.f, i.b, t, e, Kn(), n, i.c, void 0, i.h))
                    }).s(function (t) {
                        throw "auth/network-request-failed" == t.code && (i.a = null), t
                    })
                }, t.ga = function () {
                    var t = this;
                    return us(this).then(function () {
                        return t.i.bb
                    }).s(function () {
                        throw t.a = null, new ji("network-request-failed")
                    })
                }, t.Mb = function () {
                    return !0
                }, t.va = function (t) {
                    this.g.push(t)
                }, t.Ka = function (t) {
                    U(this.g, function (e) {
                        return e == t
                    })
                }, (t = fs.prototype).get = function (t) {
                    return Tt(this.a.getItem(t)).then(function (t) {
                        return t && di(t)
                    })
                }, t.set = function (t, e) {
                    return Tt(this.a.setItem(t, fi(e)))
                }, t.P = function (t) {
                    return Tt(this.a.removeItem(t))
                }, t.Y = function () {}, t.ca = function () {}, (t = ls.prototype).set = function (t, e) {
                    var n, i = !1,
                        r = this;
                    return ps(this).then(function (e) {
                        return bs((e = ms(gs(n = e, !0))).get(t))
                    }).then(function (o) {
                        var a = ms(gs(n, !0));
                        return o ? (o.value = e, bs(a.put(o))) : (r.b++, i = !0, (o = {}).fbase_key = t, o.value = e, bs(a.add(o)))
                    }).then(function () {
                        r.f[t] = e
                    }).ia(function () {
                        i && r.b--
                    })
                }, t.get = function (t) {
                    return ps(this).then(function (e) {
                        return bs(ms(gs(e, !1)).get(t))
                    }).then(function (t) {
                        return t && t.value
                    })
                }, t.P = function (t) {
                    var e = !1,
                        n = this;
                    return ps(this).then(function (i) {
                        return e = !0, n.b++, bs(ms(gs(i, !0)).delete(t))
                    }).then(function () {
                        delete n.f[t]
                    }).ia(function () {
                        e && n.b--
                    })
                }, t.Kc = function () {
                    var t = this;
                    return ps(this).then(function (t) {
                        var e = ms(gs(t, !1));
                        return e.getAll ? bs(e.getAll()) : new vt(function (t, n) {
                            var i = [],
                                r = e.openCursor();
                            r.onsuccess = function (e) {
                                (e = e.target.result) ? (i.push(e.value), e.continue()) : t(i)
                            }, r.onerror = function (t) {
                                n(Error(t.target.errorCode))
                            }
                        })
                    }).then(function (e) {
                        var n = {},
                            i = [];
                        if (0 == t.b) {
                            for (i = 0; i < e.length; i++) n[e[i].fbase_key] = e[i].value;
                            i = function t(e, n) {
                                var i, r = [];
                                for (i in e) i in n ? typeof e[i] != typeof n[i] ? r.push(i) : "object" == typeof e[i] && null != e[i] && null != n[i] ? 0 < t(e[i], n[i]).length && r.push(i) : e[i] !== n[i] && r.push(i) : r.push(i);
                                for (i in n) i in e || r.push(i);
                                return r
                            }(t.f, n), t.f = n
                        }
                        return i
                    })
                }, t.Y = function (t) {
                    0 == this.a.length && function (t) {
                        t.c && t.c.cancel("STOP_EVENT"),
                            function e() {
                                t.c = Le(800).then(g(t.Kc, t)).then(function (e) {
                                    0 < e.length && D(t.a, function (t) {
                                        t(e)
                                    })
                                }).then(e).s(function (t) {
                                    "STOP_EVENT" != t.message && e()
                                });
                                return t.c
                            }()
                    }(this), this.a.push(t)
                }, t.ca = function (t) {
                    U(this.a, function (e) {
                        return e == t
                    }), 0 == this.a.length && this.c && this.c.cancel("STOP_EVENT")
                }, (t = ys.prototype).get = function (t) {
                    return this.b.then(function (e) {
                        return e.get(t)
                    })
                }, t.set = function (t, e) {
                    return this.b.then(function (n) {
                        return n.set(t, e)
                    })
                }, t.P = function (t) {
                    return this.b.then(function (e) {
                        return e.P(t)
                    })
                }, t.Y = function (t) {
                    this.a.push(t)
                }, t.ca = function (t) {
                    U(this.a, function (e) {
                        return e == t
                    })
                }, (t = ws.prototype).get = function (t) {
                    return Tt(this.a[t])
                }, t.set = function (t, e) {
                    return this.a[t] = e, Tt()
                }, t.P = function (t) {
                    return delete this.a[t], Tt()
                }, t.Y = function () {}, t.ca = function () {}, (t = Is.prototype).get = function (t) {
                    var e = this;
                    return Tt().then(function () {
                        return di(e.a.getItem(t))
                    })
                }, t.set = function (t, e) {
                    var n = this;
                    return Tt().then(function () {
                        var i = fi(e);
                        null === i ? n.P(t) : n.a.setItem(t, i)
                    })
                }, t.P = function (t) {
                    var e = this;
                    return Tt().then(function () {
                        e.a.removeItem(t)
                    })
                }, t.Y = function (t) {
                    i.window && ge(i.window, "storage", t)
                }, t.ca = function (t) {
                    i.window && we(i.window, "storage", t)
                }, (t = As.prototype).get = function () {
                    return Tt(null)
                }, t.set = function () {
                    return Tt()
                }, t.P = function () {
                    return Tt()
                }, t.Y = function () {}, t.ca = function () {}, (t = Es.prototype).get = function (t) {
                    var e = this;
                    return Tt().then(function () {
                        return di(e.a.getItem(t))
                    })
                }, t.set = function (t, e) {
                    var n = this;
                    return Tt().then(function () {
                        var i = fi(e);
                        null === i ? n.P(t) : n.a.setItem(t, i)
                    })
                }, t.P = function (t) {
                    var e = this;
                    return Tt().then(function () {
                        e.a.removeItem(t)
                    })
                }, t.Y = function () {}, t.ca = function () {};
                var ks, Ns, _s = {
                        A: Is,
                        Qa: Es
                    },
                    Os = {
                        A: Is,
                        Qa: Es
                    },
                    Ps = {
                        A: fs,
                        Qa: As
                    },
                    Rs = {
                        A: Is,
                        Qa: As
                    },
                    Cs = {
                        Xc: "local",
                        NONE: "none",
                        Zc: "session"
                    };

                function Ds() {
                    var t = !(vi(ri()) || !Jn()),
                        e = hi(),
                        n = ai();
                    this.o = t, this.h = e, this.m = n, this.a = {}, ks || (ks = new function () {
                        var t = {};
                        t.Browser = _s, t.Node = Os, t.ReactNative = Ps, t.Worker = Rs, this.a = t[$n()]
                    }), t = ks;
                    try {
                        this.g = !Fn() && wi() || !i.indexedDB ? new t.a.A : new ys(Yn() ? new ws : new t.a.A)
                    } catch (t) {
                        this.g = new ws, this.h = !0
                    }
                    try {
                        this.i = new t.a.Qa
                    } catch (t) {
                        this.i = new ws
                    }
                    this.l = new ws, this.f = g(this.Lb, this), this.b = {}
                }

                function Ls() {
                    return Ns || (Ns = new Ds), Ns
                }

                function xs(t, e) {
                    switch (e) {
                        case "session":
                            return t.i;
                        case "none":
                            return t.l;
                        default:
                            return t.g
                    }
                }

                function Ms(t, e) {
                    return "firebase:" + t.name + (e ? ":" + e : "")
                }

                function js(t, e, n) {
                    return n = Ms(e, n), "local" == e.A && (t.b[n] = null), xs(t, e.A).P(n)
                }

                function Us(t) {
                    t.c && (clearInterval(t.c), t.c = null)
                }(t = Ds.prototype).get = function (t, e) {
                    return xs(this, t.A).get(Ms(t, e))
                }, t.set = function (t, e, n) {
                    var i = Ms(t, n),
                        r = this,
                        o = xs(this, t.A);
                    return o.set(i, e).then(function () {
                        return o.get(i)
                    }).then(function (e) {
                        "local" == t.A && (r.b[i] = e)
                    })
                }, t.addListener = function (t, e, n) {
                    t = Ms(t, e), this.m && (this.b[t] = i.localStorage.getItem(t)), rt(this.a) && (xs(this, "local").Y(this.f), this.h || (Fn() || !wi()) && i.indexedDB || !this.m || function (t) {
                        Us(t), t.c = setInterval(function () {
                            for (var e in t.a) {
                                var n = i.localStorage.getItem(e),
                                    r = t.b[e];
                                n != r && (t.b[e] = n, n = new se({
                                    type: "storage",
                                    key: e,
                                    target: window,
                                    oldValue: r,
                                    newValue: n,
                                    a: !0
                                }), t.Lb(n))
                            }
                        }, 1e3)
                    }(this)), this.a[t] || (this.a[t] = []), this.a[t].push(n)
                }, t.removeListener = function (t, e, n) {
                    t = Ms(t, e), this.a[t] && (U(this.a[t], function (t) {
                        return t == n
                    }), 0 == this.a[t].length && delete this.a[t]), rt(this.a) && (xs(this, "local").ca(this.f), Us(this))
                }, t.Lb = function (t) {
                    if (t && t.f) {
                        var e = t.a.key;
                        if (null == e)
                            for (var n in this.a) {
                                var r = this.b[n];
                                void 0 === r && (r = null);
                                var o = i.localStorage.getItem(n);
                                o !== r && (this.b[n] = o, this.Wa(n))
                            } else if (0 == e.indexOf("firebase:") && this.a[e]) {
                                if (void 0 !== t.a.a ? xs(this, "local").ca(this.f) : Us(this), this.o)
                                    if (n = i.localStorage.getItem(e), (r = t.a.newValue) !== n) null !== r ? i.localStorage.setItem(e, r) : i.localStorage.removeItem(e);
                                    else if (this.b[e] === r && void 0 === t.a.a) return;
                                var a = this;
                                n = function () {
                                    void 0 === t.a.a && a.b[e] === i.localStorage.getItem(e) || (a.b[e] = i.localStorage.getItem(e), a.Wa(e))
                                }, qt && Zt && 10 == Zt && i.localStorage.getItem(e) !== t.a.newValue && t.a.newValue !== t.a.oldValue ? setTimeout(n, 10) : n()
                            }
                    } else D(t, g(this.Wa, this))
                }, t.Wa = function (t) {
                    this.a[t] && D(this.a[t], function (t) {
                        t()
                    })
                };
                var Vs, Fs = {
                    name: "authEvent",
                    A: "local"
                };

                function Ks(t, e) {
                    this.b = -1, this.b = Hs, this.f = i.Uint8Array ? new Uint8Array(this.b) : Array(this.b), this.g = this.c = 0, this.a = [], this.i = t, this.h = e, this.m = i.Int32Array ? new Int32Array(64) : Array(64), void 0 !== Vs || (Vs = i.Int32Array ? new Int32Array(Js) : Js), this.reset()
                }
                w(Ks, function () {
                    this.b = -1
                });
                for (var Hs = 64, qs = Hs - 1, Ws = [], Gs = 0; Gs < qs; Gs++) Ws[Gs] = 0;
                var Bs = V(128, Ws);

                function Xs(t) {
                    for (var e = t.f, n = t.m, i = 0, r = 0; r < e.length;) n[i++] = e[r] << 24 | e[r + 1] << 16 | e[r + 2] << 8 | e[r + 3], r = 4 * i;
                    for (e = 16; 64 > e; e++) {
                        r = 0 | n[e - 15], i = 0 | n[e - 2];
                        var o = (0 | n[e - 16]) + ((r >>> 7 | r << 25) ^ (r >>> 18 | r << 14) ^ r >>> 3) | 0,
                            a = (0 | n[e - 7]) + ((i >>> 17 | i << 15) ^ (i >>> 19 | i << 13) ^ i >>> 10) | 0;
                        n[e] = o + a | 0
                    }
                    i = 0 | t.a[0], r = 0 | t.a[1];
                    var s = 0 | t.a[2],
                        u = 0 | t.a[3],
                        c = 0 | t.a[4],
                        h = 0 | t.a[5],
                        f = 0 | t.a[6];
                    for (o = 0 | t.a[7], e = 0; 64 > e; e++) {
                        var l = ((i >>> 2 | i << 30) ^ (i >>> 13 | i << 19) ^ (i >>> 22 | i << 10)) + (i & r ^ i & s ^ r & s) | 0;
                        a = (o = o + ((c >>> 6 | c << 26) ^ (c >>> 11 | c << 21) ^ (c >>> 25 | c << 7)) | 0) + ((a = (a = c & h ^ ~c & f) + (0 | Vs[e]) | 0) + (0 | n[e]) | 0) | 0, o = f, f = h, h = c, c = u + a | 0, u = s, s = r, r = i, i = a + l | 0
                    }
                    t.a[0] = t.a[0] + i | 0, t.a[1] = t.a[1] + r | 0, t.a[2] = t.a[2] + s | 0, t.a[3] = t.a[3] + u | 0, t.a[4] = t.a[4] + c | 0, t.a[5] = t.a[5] + h | 0, t.a[6] = t.a[6] + f | 0, t.a[7] = t.a[7] + o | 0
                }

                function zs(t, e, n) {
                    void 0 === n && (n = e.length);
                    var i = 0,
                        o = t.c;
                    if (r(e))
                        for (; i < n;) t.f[o++] = e.charCodeAt(i++), o == t.b && (Xs(t), o = 0);
                    else {
                        if (!h(e)) throw Error("message must be string or array");
                        for (; i < n;) {
                            var a = e[i++];
                            if (!("number" == typeof a && 0 <= a && 255 >= a && a == (0 | a))) throw Error("message must be a byte array");
                            t.f[o++] = a, o == t.b && (Xs(t), o = 0)
                        }
                    }
                    t.c = o, t.g += n
                }
                Ks.prototype.reset = function () {
                    this.g = this.c = 0, this.a = i.Int32Array ? new Int32Array(this.h) : F(this.h)
                };
                var Js = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298];

                function Ys() {
                    Ks.call(this, 8, $s)
                }
                w(Ys, Ks);
                var $s = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225];

                function Zs(t, e, n, i, r) {
                    this.l = t, this.i = e, this.m = n, this.o = i || null, this.u = r || null, this.h = e + ":" + n, this.v = new function () {
                        this.a = Ls()
                    }, this.g = new function (t) {
                        this.a = t, this.b = Ls()
                    }(this.h), this.f = null, this.b = [], this.a = this.c = null
                }

                function Qs(t) {
                    return new ji("invalid-cordova-configuration", t)
                }

                function tu(t) {
                    var e = new Ys;
                    zs(e, t), t = [];
                    var n = 8 * e.g;
                    56 > e.c ? zs(e, Bs, 56 - e.c) : zs(e, Bs, e.b - (e.c - 56));
                    for (var i = 63; 56 <= i; i--) e.f[i] = 255 & n, n /= 256;
                    for (Xs(e), i = n = 0; i < e.i; i++)
                        for (var r = 24; 0 <= r; r -= 8) t[n++] = e.a[i] >> r & 255;
                    return function (t) {
                        return L(t, function (t) {
                            return 1 < (t = t.toString(16)).length ? t : "0" + t
                        }).join("")
                    }(t)
                }

                function eu(t, e) {
                    for (var n = 0; n < t.b.length; n++) try {
                        t.b[n](e)
                    } catch (t) {}
                }

                function nu(t) {
                    return t.f || (t.f = t.ga().then(function () {
                        return new vt(function (e) {
                            t.va(function n(i) {
                                    return e(i), t.Ka(n), !1
                                }),
                                function (t) {
                                    function e(e) {
                                        r = !0, o && o.cancel(), iu(t).then(function (i) {
                                            var r = n;
                                            if (i && e && e.url) {
                                                var o = null; - 1 != (r = mr(e.url)).indexOf("/__/auth/callback") && (o = (o = "object" == typeof (o = di(Be(o = Xe(r), "firebaseError") || null)) ? Ui(o) : null) ? new Fr(i.b, i.c, null, null, o) : new Fr(i.b, i.c, r, i.g)), r = o || n
                                            }
                                            eu(t, r)
                                        })
                                    }
                                    var n = new Fr("unknown", null, null, null, new ji("no-auth-event")),
                                        r = !1,
                                        o = Le(500).then(function () {
                                            return iu(t).then(function () {
                                                r || eu(t, n)
                                            })
                                        }),
                                        a = i.handleOpenURL;
                                    i.handleOpenURL = function (t) {
                                        if (0 == t.toLowerCase().indexOf(oi("BuildInfo.packageName", i).toLowerCase() + "://") && e({
                                                url: t
                                            }), "function" == typeof a) try {
                                            a(t)
                                        } catch (t) {
                                            console.error(t)
                                        }
                                    }, qr || (qr = new Hr), qr.subscribe(e)
                                }(t)
                        })
                    })), t.f
                }

                function iu(t) {
                    var e = null;
                    return function (t) {
                        return t.b.get(Fs, t.a).then(function (t) {
                            return Kr(t)
                        })
                    }(t.g).then(function (n) {
                        return e = n, js((n = t.g).b, Fs, n.a)
                    }).then(function () {
                        return e
                    })
                }(t = Zs.prototype).ga = function () {
                    return this.za ? this.za : this.za = (zn(void 0) ? Xn().then(function () {
                        return new vt(function (t, e) {
                            var n = i.document,
                                r = setTimeout(function () {
                                    e(Error("Cordova framework is not ready."))
                                }, 1e3);
                            n.addEventListener("deviceready", function () {
                                clearTimeout(r), t()
                            }, !1)
                        })
                    }) : At(Error("Cordova must run in an Android or iOS file scheme."))).then(function () {
                        if ("function" != typeof oi("universalLinks.subscribe", i)) throw Qs("cordova-universal-links-plugin is not installed");
                        if (void 0 === oi("BuildInfo.packageName", i)) throw Qs("cordova-plugin-buildinfo is not installed");
                        if ("function" != typeof oi("cordova.plugins.browsertab.openUrl", i)) throw Qs("cordova-plugin-browsertab is not installed");
                        if ("function" != typeof oi("cordova.InAppBrowser.open", i)) throw Qs("cordova-plugin-inappbrowser is not installed")
                    }, function () {
                        throw new ji("cordova-not-ready")
                    })
                }, t.Ea = function (t, e) {
                    return e(new ji("operation-not-supported-in-this-environment")), Tt()
                }, t.zb = function () {
                    return At(new ji("operation-not-supported-in-this-environment"))
                }, t.Mb = function () {
                    return !1
                }, t.Ib = function () {
                    return !0
                }, t.Db = function () {
                    return !0
                }, t.Ca = function (t, e, n) {
                    if (this.c) return At(new ji("redirect-operation-pending"));
                    var r = this,
                        o = i.document,
                        a = null,
                        s = null,
                        u = null,
                        c = null;
                    return this.c = Tt().then(function () {
                        return Vr(e), nu(r)
                    }).then(function () {
                        return function (t, e, n, r) {
                            var o = function () {
                                    for (var t = 20, e = []; 0 < t;) e.push("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Math.floor(62 * Math.random()))), t--;
                                    return e.join("")
                                }(),
                                a = new Fr(e, r, null, o, new ji("no-auth-event")),
                                s = oi("BuildInfo.packageName", i);
                            if ("string" != typeof s) throw new ji("invalid-cordova-configuration");
                            var u = oi("BuildInfo.displayName", i),
                                c = {};
                            if (ri().toLowerCase().match(/iphone|ipad|ipod/)) c.ibi = s;
                            else {
                                if (!ri().toLowerCase().match(/android/)) return At(new ji("operation-not-supported-in-this-environment"));
                                c.apn = s
                            }
                            u && (c.appDisplayName = u), o = tu(o), c.sessionId = o;
                            var h = hs(t.l, t.i, t.m, e, n, null, r, t.o, c, t.u);
                            return t.ga().then(function () {
                                var e = t.h;
                                return t.v.a.set(Fs, a.D(), e)
                            }).then(function () {
                                var e = oi("cordova.plugins.browsertab.isAvailable", i);
                                if ("function" != typeof e) throw new ji("invalid-cordova-configuration");
                                var n = null;
                                e(function (e) {
                                    if (e) {
                                        if ("function" != typeof (n = oi("cordova.plugins.browsertab.openUrl", i))) throw new ji("invalid-cordova-configuration");
                                        n(h)
                                    } else {
                                        if ("function" != typeof (n = oi("cordova.InAppBrowser.open", i))) throw new ji("invalid-cordova-configuration");
                                        e = !(!(e = ri()).match(/(iPad|iPhone|iPod).*OS 7_\d/i) && !e.match(/(iPad|iPhone|iPod).*OS 8_\d/i)), t.a = n(h, e ? "_blank" : "_system", "location=yes")
                                    }
                                })
                            })
                        }(r, t, e, n)
                    }).then(function () {
                        return new vt(function (t, e) {
                            s = function () {
                                var e = oi("cordova.plugins.browsertab.close", i);
                                return t(), "function" == typeof e && e(), r.a && "function" == typeof r.a.close && (r.a.close(), r.a = null), !1
                            }, r.va(s), u = function () {
                                a || (a = Le(2e3).then(function () {
                                    e(new ji("redirect-cancelled-by-user"))
                                }))
                            }, c = function () {
                                bi() && u()
                            }, o.addEventListener("resume", u, !1), ri().toLowerCase().match(/android/) || o.addEventListener("visibilitychange", c, !1)
                        }).s(function (t) {
                            return iu(r).then(function () {
                                throw t
                            })
                        })
                    }).ia(function () {
                        u && o.removeEventListener("resume", u, !1), c && o.removeEventListener("visibilitychange", c, !1), a && a.cancel(), s && r.Ka(s), r.c = null
                    })
                }, t.va = function (t) {
                    this.b.push(t), nu(this).s(function (e) {
                        "auth/invalid-cordova-configuration" === e.code && (e = new Fr("unknown", null, null, null, new ji("no-auth-event")), t(e))
                    })
                }, t.Ka = function (t) {
                    U(this.b, function (e) {
                        return e == t
                    })
                };
                var ru = {
                    name: "pendingRedirect",
                    A: "session"
                };

                function ou(t) {
                    return js(t.b, ru, t.a)
                }

                function au(t, e, n) {
                    this.v = t, this.m = e, this.l = n, this.h = [], this.f = !1, this.i = g(this.o, this), this.c = new mu, this.u = new wu, this.g = new function (t) {
                        this.a = t, this.b = Ls()
                    }(this.m + ":" + this.l), this.b = {}, this.b.unknown = this.c, this.b.signInViaRedirect = this.c, this.b.linkViaRedirect = this.c, this.b.reauthViaRedirect = this.c, this.b.signInViaPopup = this.u, this.b.linkViaPopup = this.u, this.b.reauthViaPopup = this.u, this.a = su(this.v, this.m, this.l, za)
                }

                function su(t, n, i, r) {
                    var o = e.SDK_VERSION || null;
                    return zn() ? new Zs(t, n, i, o, r) : new as(t, n, i, o, r)
                }

                function uu(t) {
                    t.f || (t.f = !0, t.a.va(t.i));
                    var e = t.a;
                    return t.a.ga().s(function (n) {
                        throw t.a == e && t.reset(), n
                    })
                }

                function cu(t) {
                    t.a.Ib() && uu(t).s(function (e) {
                        var n = new Fr("unknown", null, null, null, new ji("operation-not-supported-in-this-environment"));
                        du(e) && t.o(n)
                    }), t.a.Db() || gu(t.c)
                }
                au.prototype.reset = function () {
                    this.f = !1, this.a.Ka(this.i), this.a = su(this.v, this.m, this.l)
                }, au.prototype.subscribe = function (t) {
                    if (M(this.h, t) || this.h.push(t), !this.f) {
                        var e = this;
                        (function (t) {
                            return t.b.get(ru, t.a).then(function (t) {
                                return "pending" == t
                            })
                        })(this.g).then(function (t) {
                            t ? ou(e.g).then(function () {
                                uu(e).s(function (t) {
                                    var n = new Fr("unknown", null, null, null, new ji("operation-not-supported-in-this-environment"));
                                    du(t) && e.o(n)
                                })
                            }) : cu(e)
                        }).s(function () {
                            cu(e)
                        })
                    }
                }, au.prototype.unsubscribe = function (t) {
                    U(this.h, function (e) {
                        return e == t
                    })
                }, au.prototype.o = function (t) {
                    if (!t) throw new ji("invalid-auth-event");
                    for (var e = !1, n = 0; n < this.h.length; n++) {
                        var i = this.h[n];
                        if (i.sb(t.b, t.c)) {
                            (e = this.b[t.b]) && e.h(t, i), e = !0;
                            break
                        }
                    }
                    return gu(this.c), e
                };
                var hu = new gi(2e3, 1e4),
                    fu = new gi(3e4, 6e4);

                function lu(t, e, n, i, r, o) {
                    return t.a.zb(e, n, i, function () {
                        t.f || (t.f = !0, t.a.va(t.i))
                    }, function () {
                        t.reset()
                    }, r, o)
                }

                function du(t) {
                    return !(!t || "auth/cordova-not-ready" != t.code)
                }
                au.prototype.fa = function () {
                    return this.c.fa()
                }, au.prototype.Ca = function (t, e, n) {
                    var i, r = this;
                    return function (t) {
                        return t.b.set(ru, "pending", t.a)
                    }(this.g).then(function () {
                        return r.a.Ca(t, e, n).s(function (t) {
                            if (du(t)) throw new ji("operation-not-supported-in-this-environment");
                            return i = t, ou(r.g).then(function () {
                                throw i
                            })
                        }).then(function () {
                            return r.a.Mb() ? new vt(function () {}) : ou(r.g).then(function () {
                                return r.fa()
                            }).then(function () {}).s(function () {})
                        })
                    })
                }, au.prototype.Ea = function (t, e, n, i) {
                    return this.a.Ea(n, function (n) {
                        t.ha(e, null, n, i)
                    }, hu.get())
                };
                var pu = {};

                function vu(t, e, n) {
                    var i = e + ":" + n;
                    return pu[i] || (pu[i] = new au(t, e, n)), pu[i]
                }

                function mu() {
                    this.b = null, this.f = [], this.c = [], this.a = null, this.g = !1
                }

                function gu(t) {
                    t.g || (t.g = !0, yu(t, !1, null, null))
                }

                function bu(t, e) {
                    if (t.b = function () {
                            return Tt(e)
                        }, t.f.length)
                        for (var n = 0; n < t.f.length; n++) t.f[n](e)
                }

                function yu(t, e, n, i) {
                    e ? i ? function (t, e) {
                        if (t.b = function () {
                                return At(e)
                            }, t.c.length)
                            for (var n = 0; n < t.c.length; n++) t.c[n](e)
                    }(t, i) : bu(t, n) : bu(t, {
                        user: null
                    }), t.f = [], t.c = []
                }

                function wu() {}

                function Iu() {
                    this.pb = !1, Object.defineProperty(this, "appVerificationDisabled", {
                        get: function () {
                            return this.pb
                        },
                        set: function (t) {
                            this.pb = t
                        },
                        enumerable: !1
                    })
                }

                function Tu(t, e) {
                    this.a = e, Si(this, "verificationId", t)
                }

                function Au(t, e, n, i) {
                    return new Mr(t).Ta(e, n).then(function (t) {
                        return new Tu(t, i)
                    })
                }

                function Eu(t, e, n) {
                    if (this.h = t, this.i = e, this.g = n, this.c = 3e4, this.f = 96e4, this.b = null, this.a = this.c, this.f < this.c) throw Error("Proactive refresh lower bound greater than upper bound!")
                }

                function Su(t) {
                    this.f = t, this.b = this.a = null, this.c = 0
                }

                function ku(t, e) {
                    var n = e[$o],
                        i = e.refreshToken;
                    e = Nu(e.expiresIn), t.b = n, t.c = e, t.a = i
                }

                function Nu(t) {
                    return y() + 1e3 * parseInt(t, 10)
                }

                function _u(t, e) {
                    return function (t, e) {
                        return new vt(function (n, i) {
                            "refresh_token" == e.grant_type && e.refresh_token || "authorization_code" == e.grant_type && e.code ? ra(t, t.i + "?key=" + encodeURIComponent(t.b), function (t) {
                                t ? t.error ? i(Xa(t)) : t.access_token && t.refresh_token ? n(t) : i(new ji("internal-error")) : i(new ji("network-request-failed"))
                            }, "POST", an(e).toString(), t.f, t.m.get()) : i(new ji("internal-error"))
                        })
                    }(t.f, e).then(function (e) {
                        return t.b = e.access_token, t.c = Nu(e.expires_in), t.a = e.refresh_token, {
                            accessToken: t.b,
                            expirationTime: t.c,
                            refreshToken: t.a
                        }
                    }).s(function (e) {
                        throw "auth/user-token-expired" == e.code && (t.a = null), e
                    })
                }

                function Ou(t, e) {
                    this.a = t || null, this.b = e || null, ki(this, {
                        lastSignInTime: yi(e || null),
                        creationTime: yi(t || null)
                    })
                }

                function Pu(t, e) {
                    for (var n in ae.call(this, t), e) this[n] = e[n]
                }

                function Ru(t, n, i) {
                    this.G = [], this.l = t.apiKey, this.o = t.appName, this.u = t.authDomain || null, t = e.SDK_VERSION ? ii(e.SDK_VERSION) : null, this.b = new Jo(this.l, Ya(za), t), this.h = new Su(this.b), Uu(this, n[$o]), ku(this.h, n), Si(this, "refreshToken", this.h.a), Ku(this, i || {}), Oe.call(this), this.I = !1, this.u && si() && (this.a = vu(this.u, this.l, this.o)), this.N = [], this.i = null, this.w = function (t) {
                        return new Eu(function () {
                            return t.F(!0)
                        }, function (t) {
                            return !(!t || "auth/network-request-failed" != t.code)
                        }, function () {
                            var e = t.h.c - y() - 3e5;
                            return 0 < e ? e : 0
                        })
                    }(this), this.V = g(this.Ha, this);
                    var r = this;
                    this.ka = null, this.sa = function (t) {
                        r.oa(t.g)
                    }, this.X = null, this.O = [], this.ra = function (t) {
                        Du(r, t.c)
                    }, this.W = null
                }

                function Cu(t, e) {
                    t.X && we(t.X, "languageCodeChanged", t.sa), (t.X = e) && ge(e, "languageCodeChanged", t.sa)
                }

                function Du(t, n) {
                    t.O = n, ia(t.b, e.SDK_VERSION ? ii(e.SDK_VERSION, t.O) : null)
                }

                function Lu(t, e) {
                    t.W && we(t.W, "frameworkChanged", t.ra), (t.W = e) && ge(e, "frameworkChanged", t.ra)
                }

                function xu(t) {
                    try {
                        return e.app(t.o).auth()
                    } catch (e) {
                        throw new ji("internal-error", "No firebase.auth.Auth instance is available for the Firebase App '" + t.o + "'!")
                    }
                }

                function Mu(t) {
                    t.C || t.w.b || (t.w.start(), we(t, "tokenChanged", t.V), ge(t, "tokenChanged", t.V))
                }

                function ju(t) {
                    we(t, "tokenChanged", t.V), t.w.stop()
                }

                function Uu(t, e) {
                    t.qa = e, Si(t, "_lat", e)
                }

                function Vu(t) {
                    for (var e = [], n = 0; n < t.N.length; n++) e.push(t.N[n](t));
                    return function (t) {
                        return new vt(function (e) {
                            var n = t.length,
                                i = [];
                            if (n)
                                for (var r = function (t, r, o) {
                                        n--, i[t] = r ? {
                                            Zb: !0,
                                            value: o
                                        } : {
                                            Zb: !1,
                                            reason: o
                                        }, 0 == n && e(i)
                                    }, o = 0; o < t.length; o++) Et(t[o], b(r, o, !0), b(r, o, !1));
                            else e(i)
                        })
                    }(e).then(function () {
                        return t
                    })
                }

                function Fu(t) {
                    t.a && !t.I && (t.I = !0, t.a.subscribe(t))
                }

                function Ku(t, e) {
                    ki(t, {
                        uid: e.uid,
                        displayName: e.displayName || null,
                        photoURL: e.photoURL || null,
                        email: e.email || null,
                        emailVerified: e.emailVerified || !1,
                        phoneNumber: e.phoneNumber || null,
                        isAnonymous: e.isAnonymous || !1,
                        metadata: new Ou(e.createdAt, e.lastLoginAt),
                        providerData: []
                    })
                }

                function Hu() {}

                function qu(t) {
                    return Tt().then(function () {
                        if (t.C) throw new ji("app-deleted")
                    })
                }

                function Wu(t) {
                    return L(t.providerData, function (t) {
                        return t.providerId
                    })
                }

                function Gu(t, e) {
                    e && (Bu(t, e.providerId), t.providerData.push(e))
                }

                function Bu(t, e) {
                    U(t.providerData, function (t) {
                        return t.providerId == e
                    })
                }

                function Xu(t, e, n) {
                    ("uid" != e || n) && t.hasOwnProperty(e) && Si(t, e, n)
                }

                function zu(t, e) {
                    t != e && (ki(t, {
                        uid: e.uid,
                        displayName: e.displayName,
                        photoURL: e.photoURL,
                        email: e.email,
                        emailVerified: e.emailVerified,
                        phoneNumber: e.phoneNumber,
                        isAnonymous: e.isAnonymous,
                        providerData: []
                    }), e.metadata ? Si(t, "metadata", function (t) {
                        return new Ou(t.a, t.b)
                    }(e.metadata)) : Si(t, "metadata", new Ou), D(e.providerData, function (e) {
                        Gu(t, e)
                    }), function (t, e) {
                        t.b = e.b, t.a = e.a, t.c = e.c
                    }(t.h, e.h), Si(t, "refreshToken", t.h.a))
                }

                function Ju(t) {
                    return t.F().then(function (e) {
                        var n = t.isAnonymous;
                        return function (t, e) {
                            return Ga(t.b, ka, {
                                idToken: e
                            }).then(g(t.uc, t))
                        }(t, e).then(function () {
                            return n || Xu(t, "isAnonymous", !1), e
                        })
                    })
                }

                function Yu(t, e) {
                    e[$o] && t.qa != e[$o] && (ku(t.h, e), t.dispatchEvent(new Pu("tokenChanged")), Uu(t, e[$o]), Xu(t, "refreshToken", t.h.a))
                }

                function $u(t, e) {
                    return Ju(t).then(function () {
                        if (M(Wu(t), e)) return Vu(t).then(function () {
                            throw new ji("provider-already-linked")
                        })
                    })
                }

                function Zu(t, e, n) {
                    return Ni({
                        user: t,
                        credential: Ur(e),
                        additionalUserInfo: e = sr(e),
                        operationType: n
                    })
                }

                function Qu(t, e) {
                    return Yu(t, e), t.reload().then(function () {
                        return t
                    })
                }

                function tc(t, n, i, r, o) {
                    if (!si()) return At(new ji("operation-not-supported-in-this-environment"));
                    if (t.i && !o) return At(t.i);
                    var a = ar(i.providerId),
                        s = pi(t.uid + ":::"),
                        u = null;
                    (!hi() || Jn()) && t.u && i.isOAuthProvider && (u = hs(t.u, t.l, t.o, n, i, null, s, e.SDK_VERSION || null));
                    var c = Gn(u, a && a.Ba, a && a.Aa);
                    return r = r().then(function () {
                        if (nc(t), !o) return t.F().then(function () {})
                    }).then(function () {
                        return lu(t.a, c, n, i, s, !!u)
                    }).then(function () {
                        return new vt(function (e, i) {
                            t.ha(n, null, new ji("cancelled-popup-request"), t.g || null), t.f = e, t.v = i, t.g = s, t.c = t.a.Ea(t, n, c, s)
                        })
                    }).then(function (t) {
                        return c && Wn(c), t ? Ni(t) : null
                    }).s(function (t) {
                        throw c && Wn(c), t
                    }), ic(t, r, o)
                }

                function ec(t, e, n, i, r) {
                    if (!si()) return At(new ji("operation-not-supported-in-this-environment"));
                    if (t.i && !r) return At(t.i);
                    var o = null,
                        a = pi(t.uid + ":::");
                    return i = i().then(function () {
                        if (nc(t), !r) return t.F().then(function () {})
                    }).then(function () {
                        return t.aa = a, Vu(t)
                    }).then(function (e) {
                        return t.ba && (e = (e = t.ba).b.set(oc, t.D(), e.a)), e
                    }).then(function () {
                        return t.a.Ca(e, n, a)
                    }).s(function (e) {
                        if (o = e, t.ba) return ac(t.ba);
                        throw o
                    }).then(function () {
                        if (o) throw o
                    }), ic(t, i, r)
                }

                function nc(t) {
                    if (!t.a || !t.I) {
                        if (t.a && !t.I) throw new ji("internal-error");
                        throw new ji("auth-domain-config-required")
                    }
                }

                function ic(t, e, n) {
                    var i = function (t, e, n) {
                        return t.i && !n ? (e.cancel(), At(t.i)) : e.s(function (e) {
                            throw !e || "auth/user-disabled" != e.code && "auth/user-token-expired" != e.code || (t.i || t.dispatchEvent(new Pu("userInvalidated")), t.i = e), e
                        })
                    }(t, e, n);
                    return t.G.push(i), i.ia(function () {
                        j(t.G, i)
                    }), i
                }

                function rc(t) {
                    if (!t.apiKey) return null;
                    var e = {
                            apiKey: t.apiKey,
                            authDomain: t.authDomain,
                            appName: t.appName
                        },
                        n = {};
                    if (!(t.stsTokenManager && t.stsTokenManager.accessToken && t.stsTokenManager.expirationTime)) return null;
                    n[$o] = t.stsTokenManager.accessToken, n.refreshToken = t.stsTokenManager.refreshToken || null, n.expiresIn = (t.stsTokenManager.expirationTime - y()) / 1e3;
                    var i = new Ru(e, n, t);
                    return t.providerData && D(t.providerData, function (t) {
                        t && Gu(i, Ni(t))
                    }), t.redirectEventId && (i.aa = t.redirectEventId), i
                }
                mu.prototype.reset = function () {
                    this.b = null, this.a && (this.a.cancel(), this.a = null)
                }, mu.prototype.h = function (t, e) {
                    if (t) {
                        this.reset(), this.g = !0;
                        var n = t.b,
                            i = t.c,
                            r = t.a && "auth/web-storage-unsupported" == t.a.code,
                            o = t.a && "auth/operation-not-supported-in-this-environment" == t.a.code;
                        "unknown" != n || r || o ? t.a ? (yu(this, !0, null, t.a), Tt()) : e.wa(n, i) ? function (t, e, n) {
                            n = n.wa(e.b, e.c);
                            var i = e.f,
                                r = e.g,
                                o = !!e.b.match(/Redirect$/);
                            n(i, r).then(function (e) {
                                yu(t, o, e, null)
                            }).s(function (e) {
                                yu(t, o, null, e)
                            })
                        }(this, t, e) : At(new ji("invalid-auth-event")) : (yu(this, !1, null, null), Tt())
                    } else At(new ji("invalid-auth-event"))
                }, mu.prototype.fa = function () {
                    var t = this;
                    return new vt(function (e, n) {
                        t.b ? t.b().then(e, n) : (t.f.push(e), t.c.push(n), function (t) {
                            var e = new ji("timeout");
                            t.a && t.a.cancel(), t.a = Le(fu.get()).then(function () {
                                t.b || yu(t, !0, null, e)
                            })
                        }(t))
                    })
                }, wu.prototype.h = function (t, e) {
                    if (t) {
                        var n = t.b,
                            i = t.c;
                        t.a ? (e.ha(t.b, null, t.a, t.c), Tt()) : e.wa(n, i) ? function (t, e) {
                            var n = t.c,
                                i = t.b;
                            e.wa(i, n)(t.f, t.g).then(function (t) {
                                e.ha(i, t, null, n)
                            }).s(function (t) {
                                e.ha(i, null, t, n)
                            })
                        }(t, e) : At(new ji("invalid-auth-event"))
                    } else At(new ji("invalid-auth-event"))
                }, Tu.prototype.confirm = function (t) {
                    return t = jr(this.verificationId, t), this.a(t)
                }, Eu.prototype.start = function () {
                    this.a = this.c,
                        function t(e, n) {
                            e.stop();
                            e.b = Le(function (t, e) {
                                return e ? (t.a = t.c, t.g()) : (e = t.a, t.a *= 2, t.a > t.f && (t.a = t.f), e)
                            }(e, n)).then(function () {
                                return t = i.document, e = null, bi() || !t ? Tt() : new vt(function (n) {
                                    e = function () {
                                        bi() && (t.removeEventListener("visibilitychange", e, !1), n())
                                    }, t.addEventListener("visibilitychange", e, !1)
                                }).s(function (n) {
                                    throw t.removeEventListener("visibilitychange", e, !1), n
                                });
                                var t, e
                            }).then(function () {
                                return e.h()
                            }).then(function () {
                                t(e, !0)
                            }).s(function (n) {
                                e.i(n) && t(e, !1)
                            })
                        }(this, !0)
                }, Eu.prototype.stop = function () {
                    this.b && (this.b.cancel(), this.b = null)
                }, Su.prototype.D = function () {
                    return {
                        apiKey: this.f.b,
                        refreshToken: this.a,
                        accessToken: this.b,
                        expirationTime: this.c
                    }
                }, Su.prototype.getToken = function (t) {
                    return t = !!t, this.b && !this.a ? At(new ji("user-token-expired")) : t || !this.b || y() > this.c - 3e4 ? this.a ? _u(this, {
                        grant_type: "refresh_token",
                        refresh_token: this.a
                    }) : Tt(null) : Tt({
                        accessToken: this.b,
                        expirationTime: this.c,
                        refreshToken: this.a
                    })
                }, Ou.prototype.D = function () {
                    return {
                        lastLoginAt: this.b,
                        createdAt: this.a
                    }
                }, w(Pu, ae), w(Ru, Oe), Ru.prototype.oa = function (t) {
                    this.ka = t, na(this.b, t)
                }, Ru.prototype.ea = function () {
                    return this.ka
                }, Ru.prototype.xa = function () {
                    return F(this.O)
                }, Ru.prototype.Ha = function () {
                    this.w.b && (this.w.stop(), this.w.start())
                }, Si(Ru.prototype, "providerId", "firebase"), (t = Ru.prototype).reload = function () {
                    var t = this;
                    return ic(this, qu(this).then(function () {
                        return Ju(t).then(function () {
                            return Vu(t)
                        }).then(Hu)
                    }))
                }, t.ac = function (t) {
                    return this.F(t).then(function (t) {
                        return new function (t) {
                            var e = nr(t);
                            if (!(e && e.exp && e.auth_time && e.iat)) throw new ji("internal-error", "An internal error occurred. The token obtained by Firebase appears to be malformed. Please retry the operation.");
                            ki(this, {
                                token: t,
                                expirationTime: yi(1e3 * e.exp),
                                authTime: yi(1e3 * e.auth_time),
                                issuedAtTime: yi(1e3 * e.iat),
                                signInProvider: e.firebase && e.firebase.sign_in_provider ? e.firebase.sign_in_provider : null,
                                claims: e
                            })
                        }(t)
                    })
                }, t.F = function (t) {
                    var e = this;
                    return ic(this, qu(this).then(function () {
                        return e.h.getToken(t)
                    }).then(function (t) {
                        if (!t) throw new ji("internal-error");
                        return t.accessToken != e.qa && (Uu(e, t.accessToken), e.dispatchEvent(new Pu("tokenChanged"))), Xu(e, "refreshToken", t.refreshToken), t.accessToken
                    }))
                }, t.uc = function (t) {
                    if (!(t = t.users) || !t.length) throw new ji("internal-error");
                    Ku(this, {
                        uid: (t = t[0]).localId,
                        displayName: t.displayName,
                        photoURL: t.photoUrl,
                        email: t.email,
                        emailVerified: !!t.emailVerified,
                        phoneNumber: t.phoneNumber,
                        lastLoginAt: t.lastLoginAt,
                        createdAt: t.createdAt
                    });
                    for (var e = function (t) {
                            return (t = t.providerUserInfo) && t.length ? L(t, function (t) {
                                return new function (t, e, n, i, r, o) {
                                    ki(this, {
                                        uid: t,
                                        displayName: i || null,
                                        photoURL: r || null,
                                        email: n || null,
                                        phoneNumber: o || null,
                                        providerId: e
                                    })
                                }(t.rawId, t.providerId, t.email, t.displayName, t.photoUrl, t.phoneNumber)
                            }) : []
                        }(t), n = 0; n < e.length; n++) Gu(this, e[n]);
                    Xu(this, "isAnonymous", !(this.email && t.passwordHash || this.providerData && this.providerData.length))
                }, t.cb = function (t) {
                    var e = this,
                        n = null;
                    return ic(this, t.f(this.b, this.uid).then(function (t) {
                        return Yu(e, t), n = Zu(e, t, "reauthenticate"), e.i = null, e.reload()
                    }).then(function () {
                        return n
                    }), !0)
                }, t.vc = function (t) {
                    return Ai("firebase.User.prototype.reauthenticateWithCredential is deprecated. Please use firebase.User.prototype.reauthenticateAndRetrieveDataWithCredential instead."), this.cb(t).then(function () {})
                }, t.ab = function (t) {
                    var e = this,
                        n = null;
                    return ic(this, $u(this, t.providerId).then(function () {
                        return e.F()
                    }).then(function (n) {
                        return t.c(e.b, n)
                    }).then(function (t) {
                        return n = Zu(e, t, "link"), Qu(e, t)
                    }).then(function () {
                        return n
                    }))
                }, t.mc = function (t) {
                    return Ai("firebase.User.prototype.linkWithCredential is deprecated. Please use firebase.User.prototype.linkAndRetrieveDataWithCredential instead."), this.ab(t).then(function (t) {
                        return t.user
                    })
                }, t.nc = function (t, e) {
                    var n = this;
                    return ic(this, $u(this, "phone").then(function () {
                        return Au(xu(n), t, e, g(n.ab, n))
                    }))
                }, t.wc = function (t, e) {
                    var n = this;
                    return ic(this, Tt().then(function () {
                        return Au(xu(n), t, e, g(n.cb, n))
                    }), !0)
                }, t.mb = function (t) {
                    var e = this;
                    return ic(this, this.F().then(function (n) {
                        return e.b.mb(n, t)
                    }).then(function (t) {
                        return Yu(e, t), e.reload()
                    }))
                }, t.Pc = function (t) {
                    var e = this;
                    return ic(this, this.F().then(function (n) {
                        return t.c(e.b, n)
                    }).then(function (t) {
                        return Yu(e, t), e.reload()
                    }))
                }, t.nb = function (t) {
                    var e = this;
                    return ic(this, this.F().then(function (n) {
                        return e.b.nb(n, t)
                    }).then(function (t) {
                        return Yu(e, t), e.reload()
                    }))
                }, t.ob = function (t) {
                    if (void 0 === t.displayName && void 0 === t.photoURL) return qu(this);
                    var e = this;
                    return ic(this, this.F().then(function (n) {
                        return e.b.ob(n, {
                            displayName: t.displayName,
                            photoUrl: t.photoURL
                        })
                    }).then(function (t) {
                        return Yu(e, t), Xu(e, "displayName", t.displayName || null), Xu(e, "photoURL", t.photoUrl || null), D(e.providerData, function (t) {
                            "password" === t.providerId && (Si(t, "displayName", e.displayName), Si(t, "photoURL", e.photoURL))
                        }), Vu(e)
                    }).then(Hu))
                }, t.Nc = function (t) {
                    var e = this;
                    return ic(this, Ju(this).then(function (n) {
                        return M(Wu(e), t) ? function (t, e, n) {
                            return Ga(t, Aa, {
                                idToken: e,
                                deleteProvider: n
                            })
                        }(e.b, n, [t]).then(function (t) {
                            var n = {};
                            return D(t.providerUserInfo || [], function (t) {
                                n[t.providerId] = !0
                            }), D(Wu(e), function (t) {
                                n[t] || Bu(e, t)
                            }), n[Mr.PROVIDER_ID] || Si(e, "phoneNumber", null), Vu(e)
                        }) : Vu(e).then(function () {
                            throw new ji("no-such-provider")
                        })
                    }))
                }, t.delete = function () {
                    var t = this;
                    return ic(this, this.F().then(function (e) {
                        return Ga(t.b, Ta, {
                            idToken: e
                        })
                    }).then(function () {
                        t.dispatchEvent(new Pu("userDeleted"))
                    })).then(function () {
                        for (var e = 0; e < t.G.length; e++) t.G[e].cancel("app-deleted");
                        Cu(t, null), Lu(t, null), t.G = [], t.C = !0, ju(t), Si(t, "refreshToken", null), t.a && t.a.unsubscribe(t)
                    })
                }, t.sb = function (t, e) {
                    return !!("linkViaPopup" == t && (this.g || null) == e && this.f || "reauthViaPopup" == t && (this.g || null) == e && this.f || "linkViaRedirect" == t && (this.aa || null) == e || "reauthViaRedirect" == t && (this.aa || null) == e)
                }, t.ha = function (t, e, n, i) {
                    "linkViaPopup" != t && "reauthViaPopup" != t || i != (this.g || null) || (n && this.v ? this.v(n) : e && !n && this.f && this.f(e), this.c && (this.c.cancel(), this.c = null), delete this.f, delete this.v)
                }, t.wa = function (t, e) {
                    return "linkViaPopup" == t && e == (this.g || null) ? g(this.xb, this) : "reauthViaPopup" == t && e == (this.g || null) ? g(this.yb, this) : "linkViaRedirect" == t && (this.aa || null) == e ? g(this.xb, this) : "reauthViaRedirect" == t && (this.aa || null) == e ? g(this.yb, this) : null
                }, t.oc = function (t) {
                    var e = this;
                    return tc(this, "linkViaPopup", t, function () {
                        return $u(e, t.providerId).then(function () {
                            return Vu(e)
                        })
                    }, !1)
                }, t.xc = function (t) {
                    return tc(this, "reauthViaPopup", t, function () {
                        return Tt()
                    }, !0)
                }, t.pc = function (t) {
                    var e = this;
                    return ec(this, "linkViaRedirect", t, function () {
                        return $u(e, t.providerId)
                    }, !1)
                }, t.yc = function (t) {
                    return ec(this, "reauthViaRedirect", t, function () {
                        return Tt()
                    }, !0)
                }, t.xb = function (t, e) {
                    var n = this;
                    this.c && (this.c.cancel(), this.c = null);
                    var i = null;
                    return ic(this, this.F().then(function (i) {
                        return va(n.b, {
                            requestUri: t,
                            sessionId: e,
                            idToken: i
                        })
                    }).then(function (t) {
                        return i = Zu(n, t, "link"), Qu(n, t)
                    }).then(function () {
                        return i
                    }))
                }, t.yb = function (t, e) {
                    var n = this;
                    this.c && (this.c.cancel(), this.c = null);
                    var i = null;
                    return ic(this, Tt().then(function () {
                        return gr(ma(n.b, {
                            requestUri: t,
                            sessionId: e
                        }), n.uid)
                    }).then(function (t) {
                        return i = Zu(n, t, "reauthenticate"), Yu(n, t), n.i = null, n.reload()
                    }).then(function () {
                        return i
                    }), !0)
                }, t.gb = function (t) {
                    var e = this,
                        n = null;
                    return ic(this, this.F().then(function (e) {
                        return n = e, void 0 === t || rt(t) ? {} : Yi(new Ki(t))
                    }).then(function (t) {
                        return e.b.gb(n, t)
                    }).then(function (t) {
                        if (e.email != t) return e.reload()
                    }).then(function () {}))
                }, t.toJSON = function () {
                    return this.D()
                }, t.D = function () {
                    var t = {
                        uid: this.uid,
                        displayName: this.displayName,
                        photoURL: this.photoURL,
                        email: this.email,
                        emailVerified: this.emailVerified,
                        phoneNumber: this.phoneNumber,
                        isAnonymous: this.isAnonymous,
                        providerData: [],
                        apiKey: this.l,
                        appName: this.o,
                        authDomain: this.u,
                        stsTokenManager: this.h.D(),
                        redirectEventId: this.aa || null
                    };
                    return this.metadata && ct(t, this.metadata.D()), D(this.providerData, function (e) {
                        t.providerData.push(function (t) {
                            var e, n = {};
                            for (e in t) t.hasOwnProperty(e) && (n[e] = t[e]);
                            return n
                        }(e))
                    }), t
                };
                var oc = {
                    name: "redirectUser",
                    A: "session"
                };

                function ac(t) {
                    return js(t.b, oc, t.a)
                }

                function sc(t) {
                    this.a = t, this.b = Ls(), this.c = null, this.f = function (t) {
                        var e = hc("local"),
                            n = hc("session"),
                            r = hc("none");
                        return function (t, e, n) {
                            var r = Ms(e, n),
                                o = xs(t, e.A);
                            return t.get(e, n).then(function (a) {
                                var s = null;
                                try {
                                    s = di(i.localStorage.getItem(r))
                                } catch (t) {}
                                if (s && !a) return i.localStorage.removeItem(r), t.set(e, s, n);
                                s && a && "localStorage" != o.type && i.localStorage.removeItem(r)
                            })
                        }(t.b, e, t.a).then(function () {
                            return t.b.get(n, t.a)
                        }).then(function (i) {
                            return i ? n : t.b.get(r, t.a).then(function (n) {
                                return n ? r : t.b.get(e, t.a).then(function (n) {
                                    return n ? e : t.b.get(cc, t.a).then(function (t) {
                                        return t ? hc(t) : e
                                    })
                                })
                            })
                        }).then(function (e) {
                            return t.c = e, uc(t, e.A)
                        }).s(function () {
                            t.c || (t.c = e)
                        })
                    }(this), this.b.addListener(hc("local"), this.a, g(this.g, this))
                }

                function uc(t, e) {
                    var n, i = [];
                    for (n in Cs) Cs[n] !== e && i.push(js(t.b, hc(Cs[n]), t.a));
                    return i.push(js(t.b, cc, t.a)),
                        function (t) {
                            return new vt(function (e, n) {
                                var i = t.length,
                                    r = [];
                                if (i)
                                    for (var o = function (t, n) {
                                            i--, r[t] = n, 0 == i && e(r)
                                        }, a = function (t) {
                                            n(t)
                                        }, s = 0; s < t.length; s++) Et(t[s], b(o, s), a);
                                else e(r)
                            })
                        }(i)
                }
                sc.prototype.g = function () {
                    var t = this,
                        e = hc("local");
                    pc(this, function () {
                        return Tt().then(function () {
                            return t.c && "local" != t.c.A ? t.b.get(e, t.a) : null
                        }).then(function (n) {
                            if (n) return uc(t, "local").then(function () {
                                t.c = e
                            })
                        })
                    })
                };
                var cc = {
                    name: "persistence",
                    A: "session"
                };

                function hc(t) {
                    return {
                        name: "authUser",
                        A: t
                    }
                }

                function fc(t, e) {
                    return pc(t, function () {
                        return t.b.set(t.c, e.D(), t.a)
                    })
                }

                function lc(t) {
                    return pc(t, function () {
                        return js(t.b, t.c, t.a)
                    })
                }

                function dc(t, e) {
                    return pc(t, function () {
                        return t.b.get(t.c, t.a).then(function (t) {
                            return t && e && (t.authDomain = e), rc(t || {})
                        })
                    })
                }

                function pc(t, e) {
                    return t.f = t.f.then(e, e), t.f
                }

                function vc(t) {
                    if (this.l = !1, Si(this, "settings", new Iu), Si(this, "app", t), !Tc(this).options || !Tc(this).options.apiKey) throw new ji("invalid-api-key");
                    t = e.SDK_VERSION ? ii(e.SDK_VERSION) : null, this.b = new Jo(Tc(this).options && Tc(this).options.apiKey, Ya(za), t), this.N = [], this.o = [], this.I = [], this.Pb = e.INTERNAL.createSubscribe(g(this.ic, this)), this.O = void 0, this.Qb = e.INTERNAL.createSubscribe(g(this.jc, this)), wc(this, null), this.h = new sc(Tc(this).options.apiKey + ":" + Tc(this).name), this.w = new function (t) {
                            this.a = t, this.b = Ls()
                        }(Tc(this).options.apiKey + ":" + Tc(this).name), this.V = kc(this, function (t) {
                            var e = Tc(t).options.authDomain,
                                n = function (t) {
                                    var e = function (t, e) {
                                        return t.b.get(oc, t.a).then(function (t) {
                                            return t && e && (t.authDomain = e), rc(t || {})
                                        })
                                    }(t.w, Tc(t).options.authDomain).then(function (e) {
                                        return (t.C = e) && (e.ba = t.w), ac(t.w)
                                    });
                                    return kc(t, e)
                                }(t).then(function () {
                                    return dc(t.h, e)
                                }).then(function (e) {
                                    return e ? (e.ba = t.w, t.C && (t.C.aa || null) == (e.aa || null) ? e : e.reload().then(function () {
                                        return fc(t.h, e).then(function () {
                                            return e
                                        })
                                    }).s(function (n) {
                                        return "auth/network-request-failed" == n.code ? e : lc(t.h)
                                    })) : null
                                }).then(function (e) {
                                    wc(t, e || null)
                                });
                            return kc(t, n)
                        }(this)), this.i = kc(this, function (t) {
                            return t.V.then(function () {
                                return t.fa()
                            }).s(function () {}).then(function () {
                                if (!t.l) return t.ka()
                            }).s(function () {}).then(function () {
                                if (!t.l) {
                                    t.X = !0;
                                    var e = t.h;
                                    e.b.addListener(hc("local"), e.a, t.ka)
                                }
                            })
                        }(this)), this.X = !1, this.ka = g(this.Jc, this), this.Ha = g(this.Z, this), this.qa = g(this.Yb, this), this.ra = g(this.gc, this), this.sa = g(this.hc, this),
                        function (t) {
                            var e = Tc(t).options.authDomain,
                                n = Tc(t).options.apiKey;
                            e && si() && (t.Ob = t.V.then(function () {
                                if (!t.l) {
                                    if (t.a = vu(e, n, Tc(t).name), t.a.subscribe(t), Ac(t) && Fu(Ac(t)), t.C) {
                                        Fu(t.C);
                                        var i = t.C;
                                        i.oa(t.ea()), Cu(i, t), Du(i = t.C, t.G), Lu(i, t), t.C = null
                                    }
                                    return t.a
                                }
                            }))
                        }(this), this.INTERNAL = {}, this.INTERNAL.delete = g(this.delete, this), this.INTERNAL.logFramework = g(this.qc, this), this.u = 0, Oe.call(this),
                        function (t) {
                            Object.defineProperty(t, "lc", {
                                get: function () {
                                    return this.ea()
                                },
                                set: function (t) {
                                    this.oa(t)
                                },
                                enumerable: !1
                            }), t.W = null
                        }(this), this.G = []
                }

                function mc(t) {
                    ae.call(this, "languageCodeChanged"), this.g = t
                }

                function gc(t) {
                    ae.call(this, "frameworkChanged"), this.c = t
                }

                function bc(t) {
                    return t.Ob || At(new ji("auth-domain-config-required"))
                }

                function yc(t, e) {
                    var n = {};
                    return n.apiKey = Tc(t).options.apiKey, n.authDomain = Tc(t).options.authDomain, n.appName = Tc(t).name, t.V.then(function () {
                        return function (t, e, n, i) {
                            var r = new Ru(t, e);
                            return n && (r.ba = n), i && Du(r, i), r.reload().then(function () {
                                return r
                            })
                        }(n, e, t.w, t.xa())
                    }).then(function (e) {
                        return Ac(t) && e.uid == Ac(t).uid ? (zu(Ac(t), e), t.Z(e)) : (wc(t, e), Fu(e), t.Z(e))
                    }).then(function () {
                        Sc(t)
                    })
                }

                function wc(t, e) {
                    Ac(t) && (function (t, e) {
                        U(t.N, function (t) {
                            return t == e
                        })
                    }(Ac(t), t.Ha), we(Ac(t), "tokenChanged", t.qa), we(Ac(t), "userDeleted", t.ra), we(Ac(t), "userInvalidated", t.sa), ju(Ac(t))), e && (e.N.push(t.Ha), ge(e, "tokenChanged", t.qa), ge(e, "userDeleted", t.ra), ge(e, "userInvalidated", t.sa), 0 < t.u && Mu(e)), Si(t, "currentUser", e), e && (e.oa(t.ea()), Cu(e, t), Du(e, t.G), Lu(e, t))
                }

                function Ic(t, e) {
                    var n = null,
                        i = null;
                    return kc(t, e.then(function (e) {
                        return n = Ur(e), i = sr(e), yc(t, e)
                    }).then(function () {
                        return Ni({
                            user: Ac(t),
                            credential: n,
                            additionalUserInfo: i,
                            operationType: "signIn"
                        })
                    }))
                }

                function Tc(t) {
                    return t.app
                }

                function Ac(t) {
                    return t.currentUser
                }

                function Ec(t) {
                    return Ac(t) && Ac(t)._lat || null
                }

                function Sc(t) {
                    if (t.X) {
                        for (var e = 0; e < t.o.length; e++) t.o[e] && t.o[e](Ec(t));
                        if (t.O !== t.getUid() && t.I.length)
                            for (t.O = t.getUid(), e = 0; e < t.I.length; e++) t.I[e] && t.I[e](Ec(t))
                    }
                }

                function kc(t, e) {
                    return t.N.push(e), e.ia(function () {
                        j(t.N, e)
                    }), e
                }

                function Nc() {}

                function _c() {
                    this.a = {}, this.b = 1e12
                }
                sc.prototype.jb = function (t) {
                    var e = null,
                        n = this;
                    return function (t) {
                        var e = new ji("invalid-persistence-type"),
                            n = new ji("unsupported-persistence-type");
                        t: {
                            for (i in Cs)
                                if (Cs[i] == t) {
                                    var i = !0;
                                    break t
                                }
                            i = !1
                        }
                        if (!i || "string" != typeof t) throw e;
                        switch ($n()) {
                            case "ReactNative":
                                if ("session" === t) throw n;
                                break;
                            case "Node":
                                if ("none" !== t) throw n;
                                break;
                            default:
                                if (!ai() && "none" !== t) throw n
                        }
                    }(t), pc(this, function () {
                        return t != n.c.A ? n.b.get(n.c, n.a).then(function (i) {
                            return e = i, uc(n, t)
                        }).then(function () {
                            if (n.c = hc(t), e) return n.b.set(n.c, e, n.a)
                        }) : Tt()
                    })
                }, w(vc, Oe), w(mc, ae), w(gc, ae), (t = vc.prototype).jb = function (t) {
                    return kc(this, t = this.h.jb(t))
                }, t.oa = function (t) {
                    this.W === t || this.l || (this.W = t, na(this.b, this.W), this.dispatchEvent(new mc(this.ea())))
                }, t.ea = function () {
                    return this.W
                }, t.Qc = function () {
                    var t = i.navigator;
                    this.oa(t && (t.languages && t.languages[0] || t.language || t.userLanguage) || null)
                }, t.qc = function (t) {
                    this.G.push(t), ia(this.b, e.SDK_VERSION ? ii(e.SDK_VERSION, this.G) : null), this.dispatchEvent(new gc(this.G))
                }, t.xa = function () {
                    return F(this.G)
                }, t.toJSON = function () {
                    return {
                        apiKey: Tc(this).options.apiKey,
                        authDomain: Tc(this).options.authDomain,
                        appName: Tc(this).name,
                        currentUser: Ac(this) && Ac(this).D()
                    }
                }, t.sb = function (t, e) {
                    switch (t) {
                        case "unknown":
                        case "signInViaRedirect":
                            return !0;
                        case "signInViaPopup":
                            return this.g == e && !!this.f;
                        default:
                            return !1
                    }
                }, t.ha = function (t, e, n, i) {
                    "signInViaPopup" == t && this.g == i && (n && this.v ? this.v(n) : e && !n && this.f && this.f(e), this.c && (this.c.cancel(), this.c = null), delete this.f, delete this.v)
                }, t.wa = function (t, e) {
                    return "signInViaRedirect" == t || "signInViaPopup" == t && this.g == e && this.f ? g(this.Xb, this) : null
                }, t.Xb = function (t, e) {
                    var n = this;
                    t = {
                        requestUri: t,
                        sessionId: e
                    }, this.c && (this.c.cancel(), this.c = null);
                    var i = null,
                        r = null,
                        o = pa(n.b, t).then(function (t) {
                            return i = Ur(t), r = sr(t), t
                        });
                    return kc(this, t = n.V.then(function () {
                        return o
                    }).then(function (t) {
                        return yc(n, t)
                    }).then(function () {
                        return Ni({
                            user: Ac(n),
                            credential: i,
                            additionalUserInfo: r,
                            operationType: "signIn"
                        })
                    }))
                }, t.Hc = function (t) {
                    if (!si()) return At(new ji("operation-not-supported-in-this-environment"));
                    var n = this,
                        i = ar(t.providerId),
                        r = pi(),
                        o = null;
                    (!hi() || Jn()) && Tc(this).options.authDomain && t.isOAuthProvider && (o = hs(Tc(this).options.authDomain, Tc(this).options.apiKey, Tc(this).name, "signInViaPopup", t, null, r, e.SDK_VERSION || null));
                    var a = Gn(o, i && i.Ba, i && i.Aa);
                    return kc(this, i = bc(this).then(function (e) {
                        return lu(e, a, "signInViaPopup", t, r, !!o)
                    }).then(function () {
                        return new vt(function (t, e) {
                            n.ha("signInViaPopup", null, new ji("cancelled-popup-request"), n.g), n.f = t, n.v = e, n.g = r, n.c = n.a.Ea(n, "signInViaPopup", a, r)
                        })
                    }).then(function (t) {
                        return a && Wn(a), t ? Ni(t) : null
                    }).s(function (t) {
                        throw a && Wn(a), t
                    }))
                }, t.Ic = function (t) {
                    if (!si()) return At(new ji("operation-not-supported-in-this-environment"));
                    var e = this;
                    return kc(this, bc(this).then(function () {
                        return pc(t = e.h, function () {
                            return t.b.set(cc, t.c.A, t.a)
                        });
                        var t
                    }).then(function () {
                        return e.a.Ca("signInViaRedirect", t)
                    }))
                }, t.fa = function () {
                    if (!si()) return At(new ji("operation-not-supported-in-this-environment"));
                    var t = this;
                    return kc(this, bc(this).then(function () {
                        return t.a.fa()
                    }).then(function (t) {
                        return t ? Ni(t) : null
                    }))
                }, t.Oc = function (t) {
                    if (!t) return At(new ji("null-user"));
                    var e = this,
                        n = {};
                    n.apiKey = Tc(this).options.apiKey, n.authDomain = Tc(this).options.authDomain, n.appName = Tc(this).name;
                    var i = function (t, e, n, i) {
                        e = e || {
                            apiKey: t.l,
                            authDomain: t.u,
                            appName: t.o
                        };
                        var r = t.h,
                            o = {};
                        return o[$o] = r.b, o.refreshToken = r.a, o.expiresIn = (r.c - y()) / 1e3, e = new Ru(e, o), n && (e.ba = n), i && Du(e, i), zu(e, t), e
                    }(t, n, e.w, e.xa());
                    return kc(this, this.i.then(function () {
                        if (Tc(e).options.apiKey != t.l) return i.reload()
                    }).then(function () {
                        return Ac(e) && t.uid == Ac(e).uid ? (zu(Ac(e), t), e.Z(t)) : (wc(e, i), Fu(i), e.Z(i))
                    }).then(function () {
                        Sc(e)
                    }))
                }, t.kb = function () {
                    var t = this;
                    return kc(this, this.i.then(function () {
                        return Ac(t) ? (wc(t, null), lc(t.h).then(function () {
                            Sc(t)
                        })) : Tt()
                    }))
                }, t.Jc = function () {
                    var t = this;
                    return dc(this.h, Tc(this).options.authDomain).then(function (e) {
                        if (!t.l) {
                            var n;
                            if (n = Ac(t) && e) {
                                n = Ac(t).uid;
                                var i = e.uid;
                                n = void 0 !== n && null !== n && "" !== n && void 0 !== i && null !== i && "" !== i && n == i
                            }
                            if (n) return zu(Ac(t), e), Ac(t).F();
                            (Ac(t) || e) && (wc(t, e), e && (Fu(e), e.ba = t.w), t.a && t.a.subscribe(t), Sc(t))
                        }
                    })
                }, t.Z = function (t) {
                    return fc(this.h, t)
                }, t.Yb = function () {
                    Sc(this), this.Z(Ac(this))
                }, t.gc = function () {
                    this.kb()
                }, t.hc = function () {
                    this.kb()
                }, t.ic = function (t) {
                    var e = this;
                    this.addAuthTokenListener(function () {
                        t.next(Ac(e))
                    })
                }, t.jc = function (t) {
                    var e = this;
                    ! function (t, e) {
                        t.I.push(e), kc(t, t.i.then(function () {
                            !t.l && M(t.I, e) && t.O !== t.getUid() && (t.O = t.getUid(), e(Ec(t)))
                        }))
                    }(this, function () {
                        t.next(Ac(e))
                    })
                }, t.sc = function (t, n, i) {
                    var r = this;
                    return this.X && e.Promise.resolve().then(function () {
                        f(t) ? t(Ac(r)) : f(t.next) && t.next(Ac(r))
                    }), this.Pb(t, n, i)
                }, t.rc = function (t, n, i) {
                    var r = this;
                    return this.X && e.Promise.resolve().then(function () {
                        r.O = r.getUid(), f(t) ? t(Ac(r)) : f(t.next) && t.next(Ac(r))
                    }), this.Qb(t, n, i)
                }, t.$b = function (t) {
                    var e = this;
                    return kc(this, this.i.then(function () {
                        return Ac(e) ? Ac(e).F(t).then(function (t) {
                            return {
                                accessToken: t
                            }
                        }) : null
                    }))
                }, t.Jb = function (t) {
                    var e = this;
                    return this.i.then(function () {
                        return Ic(e, Ga(e.b, Fa, {
                            token: t
                        }))
                    }).then(function (t) {
                        var n = t.user;
                        return Xu(n, "isAnonymous", !1), e.Z(n), t
                    })
                }, t.Bc = function (t) {
                    return Ai("firebase.auth.Auth.prototype.signInAndRetrieveDataWithCustomToken is deprecated. Please use firebase.auth.Auth.prototype.signInWithCustomToken instead."), this.Jb(t)
                }, t.Cc = function (t, e) {
                    return Ai("firebase.auth.Auth.prototype.signInAndRetrieveDataWithEmailAndPassword is deprecated. Please use firebase.auth.Auth.prototype.signInWithEmailAndPassword instead."), this.Kb(t, e)
                }, t.Kb = function (t, e) {
                    var n = this;
                    return this.i.then(function () {
                        return Ic(n, Ga(n.b, Ka, {
                            email: t,
                            password: e
                        }))
                    })
                }, t.ub = function (t, e) {
                    var n = this;
                    return this.i.then(function () {
                        return Ic(n, Ga(n.b, wa, {
                            email: t,
                            password: e
                        }))
                    })
                }, t.Sb = function (t, e) {
                    return Ai("firebase.auth.Auth.prototype.createUserAndRetrieveDataWithEmailAndPassword is deprecated. Please use firebase.auth.Auth.prototype.createUserWithEmailAndPassword instead."), this.ub(t, e)
                }, t.Ec = function (t) {
                    return Ai("firebase.auth.Auth.prototype.signInWithCredential is deprecated. Please use firebase.auth.Auth.prototype.signInAndRetrieveDataWithCredential instead."), this.Oa(t).then(function (t) {
                        return t.user
                    })
                }, t.Oa = function (t) {
                    var e = this;
                    return this.i.then(function () {
                        return Ic(e, t.ya(e.b))
                    })
                }, t.Pa = function () {
                    var t = this;
                    return this.i.then(function () {
                        var e = Ac(t);
                        return e && e.isAnonymous ? Ni({
                            user: e,
                            credential: null,
                            additionalUserInfo: Ni({
                                providerId: null,
                                isNewUser: !1
                            }),
                            operationType: "signIn"
                        }) : Ic(t, t.b.Pa()).then(function (e) {
                            var n = e.user;
                            return Xu(n, "isAnonymous", !0), t.Z(n), e
                        })
                    })
                }, t.Dc = function () {
                    return Ai("firebase.auth.Auth.prototype.signInAnonymouslyAndRetrieveData is deprecated. Please use firebase.auth.Auth.prototype.signInAnonymously instead."), this.Pa()
                }, t.getUid = function () {
                    return Ac(this) && Ac(this).uid || null
                }, t.Rb = function (t) {
                    this.addAuthTokenListener(t), this.u++, 0 < this.u && Ac(this) && Mu(Ac(this))
                }, t.zc = function (t) {
                    var e = this;
                    D(this.o, function (n) {
                        n == t && e.u--
                    }), 0 > this.u && (this.u = 0), 0 == this.u && Ac(this) && ju(Ac(this)), this.removeAuthTokenListener(t)
                }, t.addAuthTokenListener = function (t) {
                    var e = this;
                    this.o.push(t), kc(this, this.i.then(function () {
                        e.l || M(e.o, t) && t(Ec(e))
                    }))
                }, t.removeAuthTokenListener = function (t) {
                    U(this.o, function (e) {
                        return e == t
                    })
                }, t.delete = function () {
                    this.l = !0;
                    for (var t = 0; t < this.N.length; t++) this.N[t].cancel("app-deleted");
                    return this.N = [], this.h && (t = this.h).b.removeListener(hc("local"), t.a, this.ka), this.a && this.a.unsubscribe(this), e.Promise.resolve()
                }, t.Vb = function (t) {
                    return Ai("firebase.auth.Auth.prototype.fetchProvidersForEmail is deprecated. Please use firebase.auth.Auth.prototype.fetchSignInMethodsForEmail instead."), kc(this, function (t, e) {
                        return Ga(t, Ia, {
                            identifier: e,
                            continueUri: ui() ? Kn() : "http://localhost"
                        }).then(function (t) {
                            return t.allProviders || []
                        })
                    }(this.b, t))
                }, t.Wb = function (t) {
                    return kc(this, function (t, e) {
                        return Ga(t, Ia, {
                            identifier: e,
                            continueUri: ui() ? Kn() : "http://localhost"
                        }).then(function (t) {
                            return t.signinMethods || []
                        })
                    }(this.b, t))
                }, t.kc = function (t) {
                    return !!Dr(t)
                }, t.ib = function (t, e) {
                    var n = this;
                    return kc(this, Tt().then(function () {
                        var t = new Ki(e);
                        if (!t.c) throw new ji("argument-error", qi + " must be true when sending sign in link to email");
                        return Yi(t)
                    }).then(function (e) {
                        return n.b.ib(t, e)
                    }).then(function () {}))
                }, t.Rc = function (t) {
                    return this.Ja(t).then(function (t) {
                        return t.data.email
                    })
                }, t.Xa = function (t, e) {
                    return kc(this, this.b.Xa(t, e).then(function () {}))
                }, t.Ja = function (t) {
                    return kc(this, this.b.Ja(t).then(function (t) {
                        return new function (t) {
                            var e = {},
                                n = t[Pi],
                                i = t[Ri];
                            if (!(t = t[Ci]) || t != Oi && !n) throw Error("Invalid provider user info!");
                            e[Li] = i || null, e[Di] = n || null, Si(this, Mi, t), Si(this, xi, _i(e))
                        }(t)
                    }))
                }, t.Va = function (t) {
                    return kc(this, this.b.Va(t).then(function () {}))
                }, t.hb = function (t, e) {
                    var n = this;
                    return kc(this, Tt().then(function () {
                        return void 0 === e || rt(e) ? {} : Yi(new Ki(e))
                    }).then(function (e) {
                        return n.b.hb(t, e)
                    }).then(function () {}))
                }, t.Gc = function (t, e) {
                    return kc(this, Au(this, t, e, g(this.Oa, this)))
                }, t.Fc = function (t, e) {
                    var n = this;
                    return kc(this, Tt().then(function () {
                        var i = Cr(t, e || Kn());
                        return n.Oa(i)
                    }))
                }, Nc.prototype.render = function () {}, Nc.prototype.reset = function () {}, Nc.prototype.getResponse = function () {}, Nc.prototype.execute = function () {};
                var Oc = null;

                function Pc(t, e) {
                    return (e = Rc(e)) && t.a[e] || null
                }

                function Rc(t) {
                    return (t = void 0 === t ? 1e12 : t) ? t.toString() : null
                }

                function Cc(t, e) {
                    this.g = !1, this.c = e, this.a = this.b = null, this.h = "invisible" !== this.c.size, this.f = Rn(t);
                    var n = this;
                    this.i = function () {
                        n.execute()
                    }, this.h ? this.execute() : ge(this.f, "click", this.i)
                }

                function Dc(t) {
                    if (t.g) throw Error("reCAPTCHA mock was already deleted!")
                }

                function Lc() {}
                _c.prototype.render = function (t, e) {
                    return this.a[this.b.toString()] = new Cc(t, e), this.b++
                }, _c.prototype.reset = function (t) {
                    var e = Pc(this, t);
                    t = Rc(t), e && t && (e.delete(), delete this.a[t])
                }, _c.prototype.getResponse = function (t) {
                    return (t = Pc(this, t)) ? t.getResponse() : null
                }, _c.prototype.execute = function (t) {
                    (t = Pc(this, t)) && t.execute()
                }, Cc.prototype.getResponse = function () {
                    return Dc(this), this.b
                }, Cc.prototype.execute = function () {
                    Dc(this);
                    var t = this;
                    this.a || (this.a = setTimeout(function () {
                        t.b = function () {
                            for (var t = 50, e = []; 0 < t;) e.push("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Math.floor(62 * Math.random()))), t--;
                            return e.join("")
                        }();
                        var e = t.c.callback,
                            n = t.c["expired-callback"];
                        if (e) try {
                            e(t.b)
                        } catch (t) {}
                        t.a = setTimeout(function () {
                            if (t.a = null, t.b = null, n) try {
                                n()
                            } catch (t) {}
                            t.h && t.execute()
                        }, 6e4)
                    }, 500))
                }, Cc.prototype.delete = function () {
                    Dc(this), this.g = !0, clearTimeout(this.a), this.a = null, we(this.f, "click", this.i)
                }, Lc.prototype.g = function () {
                    return Oc || (Oc = new _c), Tt(Oc)
                }, Lc.prototype.c = function () {};
                var xc = null;

                function Mc() {
                    this.b = i.grecaptcha ? 1 / 0 : 0, this.f = null, this.a = "__rcb" + Math.floor(1e6 * Math.random()).toString()
                }
                var jc = vn("https://www.google.com/recaptcha/api.js?onload=%{onload}&render=explicit&hl=%{hl}"),
                    Uc = new gi(3e4, 6e4);
                Mc.prototype.g = function (t) {
                    var e = this;
                    return new vt(function (n, r) {
                        var o = setTimeout(function () {
                            r(new ji("network-request-failed"))
                        }, Uc.get());
                        !i.grecaptcha || t !== e.f && !e.b ? (i[e.a] = function () {
                            if (i.grecaptcha) {
                                e.f = t;
                                var a = i.grecaptcha.render;
                                i.grecaptcha.render = function (t, n) {
                                    return t = a(t, n), e.b++, t
                                }, clearTimeout(o), n(i.grecaptcha)
                            } else clearTimeout(o), r(new ji("internal-error"));
                            delete i[e.a]
                        }, Tt(Ho(bn(jc, {
                            onload: e.a,
                            hl: t || ""
                        }))).s(function () {
                            clearTimeout(o), r(new ji("internal-error", "Unable to load external reCAPTCHA dependencies!"))
                        })) : (clearTimeout(o), n(i.grecaptcha))
                    })
                }, Mc.prototype.c = function () {
                    this.b--
                };
                var Vc = null;

                function Fc(t, e, n, r, o, a, s) {
                    if (Si(this, "type", "recaptcha"), this.c = this.f = null, this.C = !1, this.l = e, this.g = null, s ? (xc || (xc = new Lc), s = xc) : (Vc || (Vc = new Mc), s = Vc), this.o = s, this.a = n || {
                            theme: "light",
                            type: "image"
                        }, this.h = [], this.a[qc]) throw new ji("argument-error", "sitekey should not be provided for reCAPTCHA as one is automatically provisioned for the current project.");
                    if (this.i = "invisible" === this.a[Wc], !i.document) throw new ji("operation-not-supported-in-this-environment", "RecaptchaVerifier is only supported in a browser HTTP/HTTPS environment with DOM support.");
                    if (!Rn(e) || !this.i && Rn(e).hasChildNodes()) throw new ji("argument-error", "reCAPTCHA container is either not found or already contains inner elements!");
                    this.u = new Jo(t, a || null, o || null), this.v = r || function () {
                        return null
                    };
                    var u = this;
                    this.m = [];
                    var c = this.a[Kc];
                    this.a[Kc] = function (t) {
                        if (Gc(u, t), "function" == typeof c) c(t);
                        else if ("string" == typeof c) {
                            var e = oi(c, i);
                            "function" == typeof e && e(t)
                        }
                    };
                    var h = this.a[Hc];
                    this.a[Hc] = function () {
                        if (Gc(u, null), "function" == typeof h) h();
                        else if ("string" == typeof h) {
                            var t = oi(h, i);
                            "function" == typeof t && t()
                        }
                    }
                }
                var Kc = "callback",
                    Hc = "expired-callback",
                    qc = "sitekey",
                    Wc = "size";

                function Gc(t, e) {
                    for (var n = 0; n < t.m.length; n++) try {
                        t.m[n](e)
                    } catch (t) {}
                }

                function Bc(t, e) {
                    return t.h.push(e), e.ia(function () {
                        j(t.h, e)
                    }), e
                }

                function Xc(t) {
                    if (t.C) throw new ji("internal-error", "RecaptchaVerifier instance has been destroyed.")
                }

                function zc(t, n, i) {
                    var r = !1;
                    try {
                        this.b = i || e.app()
                    } catch (t) {
                        throw new ji("argument-error", "No firebase.app.App instance is currently initialized.")
                    }
                    if (!this.b.options || !this.b.options.apiKey) throw new ji("invalid-api-key");
                    i = this.b.options.apiKey;
                    var o = this,
                        a = null;
                    try {
                        a = this.b.auth().xa()
                    } catch (t) {}
                    try {
                        r = this.b.auth().settings.appVerificationDisabledForTesting
                    } catch (t) {}
                    a = e.SDK_VERSION ? ii(e.SDK_VERSION, a) : null, Fc.call(this, i, t, n, function () {
                        try {
                            var t = o.b.auth().ea()
                        } catch (e) {
                            t = null
                        }
                        return t
                    }, a, Ya(za), r)
                }

                function Jc(t, e, n, i) {
                    t: {
                        n = Array.prototype.slice.call(n);
                        for (var r = 0, o = !1, a = 0; a < e.length; a++)
                            if (e[a].optional) o = !0;
                            else {
                                if (o) throw new ji("internal-error", "Argument validator encountered a required argument after an optional argument.");
                                r++
                            }
                        if (o = e.length, n.length < r || o < n.length) i = "Expected " + (r == o ? 1 == r ? "1 argument" : r + " arguments" : r + "-" + o + " arguments") + " but got " + n.length + ".";
                        else {
                            for (r = 0; r < n.length; r++)
                                if (o = e[r].optional && void 0 === n[r], !e[r].M(n[r]) && !o) {
                                    if (e = e[r], 0 > r || r >= Yc.length) throw new ji("internal-error", "Argument validator received an unsupported number of arguments.");
                                    n = Yc[r], i = (i ? "" : n + " argument ") + (e.name ? '"' + e.name + '" ' : "") + "must be " + e.K + ".";
                                    break t
                                }
                            i = null
                        }
                    }
                    if (i) throw new ji("argument-error", t + " failed: " + i)
                }(t = Fc.prototype).za = function () {
                    var t = this;
                    return this.f ? this.f : this.f = Bc(this, Tt().then(function () {
                        if (ui() && !Yn()) return Xn();
                        throw new ji("operation-not-supported-in-this-environment", "RecaptchaVerifier is only supported in a browser HTTP/HTTPS environment.")
                    }).then(function () {
                        return t.o.g(t.v())
                    }).then(function (e) {
                        return t.g = e, Ga(t.u, Ra, {})
                    }).then(function (e) {
                        t.a[qc] = e.recaptchaSiteKey
                    }).s(function (e) {
                        throw t.f = null, e
                    }))
                }, t.render = function () {
                    Xc(this);
                    var t = this;
                    return Bc(this, this.za().then(function () {
                        if (null === t.c) {
                            var e = t.l;
                            if (!t.i) {
                                var n = Rn(e);
                                e = Ln("DIV"), n.appendChild(e)
                            }
                            t.c = t.g.render(e, t.a)
                        }
                        return t.c
                    }))
                }, t.verify = function () {
                    Xc(this);
                    var t = this;
                    return Bc(this, this.render().then(function (e) {
                        return new vt(function (n) {
                            var i = t.g.getResponse(e);
                            if (i) n(i);
                            else {
                                var r = function (e) {
                                    e && (function (t, e) {
                                        U(t.m, function (t) {
                                            return t == e
                                        })
                                    }(t, r), n(e))
                                };
                                t.m.push(r), t.i && t.g.execute(t.c)
                            }
                        })
                    }))
                }, t.reset = function () {
                    Xc(this), null !== this.c && this.g.reset(this.c)
                }, t.clear = function () {
                    Xc(this), this.C = !0, this.o.c();
                    for (var t = 0; t < this.h.length; t++) this.h[t].cancel("RecaptchaVerifier instance has been destroyed.");
                    if (!this.i) {
                        t = Rn(this.l);
                        for (var e; e = t.firstChild;) t.removeChild(e)
                    }
                }, w(zc, Fc);
                var Yc = "First Second Third Fourth Fifth Sixth Seventh Eighth Ninth".split(" ");

                function $c(t, e) {
                    return {
                        name: t || "",
                        K: "a valid string",
                        optional: !!e,
                        M: r
                    }
                }

                function Zc(t, e) {
                    return {
                        name: t || "",
                        K: "a boolean",
                        optional: !!e,
                        M: o
                    }
                }

                function Qc(t, e) {
                    return {
                        name: t || "",
                        K: "a valid object",
                        optional: !!e,
                        M: l
                    }
                }

                function th(t, e) {
                    return {
                        name: t || "",
                        K: "a function",
                        optional: !!e,
                        M: f
                    }
                }

                function eh(t, e) {
                    return {
                        name: t || "",
                        K: "null",
                        optional: !!e,
                        M: u
                    }
                }

                function nh(t) {
                    return {
                        name: t ? t + "Credential" : "credential",
                        K: t ? "a valid " + t + " credential" : "a valid credential",
                        optional: !1,
                        M: function (e) {
                            if (!e) return !1;
                            var n = !t || e.providerId === t;
                            return !(!e.ya || !n)
                        }
                    }
                }

                function ih() {
                    return {
                        name: "applicationVerifier",
                        K: "an implementation of firebase.auth.ApplicationVerifier",
                        optional: !1,
                        M: function (t) {
                            return !!(t && r(t.type) && f(t.verify))
                        }
                    }
                }

                function rh(t, e, n, i) {
                    return {
                        name: n || "",
                        K: t.K + " or " + e.K,
                        optional: !!i,
                        M: function (n) {
                            return t.M(n) || e.M(n)
                        }
                    }
                }

                function oh(t, e) {
                    for (var n in e) {
                        var i = e[n].name;
                        t[i] = uh(i, t[n], e[n].j)
                    }
                }

                function ah(t, e) {
                    for (var n in e) {
                        var i = e[n].name;
                        if (i !== n) {
                            var r = e[n].qb;
                            Object.defineProperty(t, i, {
                                get: function () {
                                    return this[n]
                                },
                                set: function (t) {
                                    Jc(i, [r], [t], !0), this[n] = t
                                },
                                enumerable: !0
                            })
                        }
                    }
                }

                function sh(t, e, n, i) {
                    t[e] = uh(e, n, i)
                }

                function uh(t, e, n) {
                    function i() {
                        var t = Array.prototype.slice.call(arguments);
                        return Jc(o, n, t), e.apply(this, t)
                    }
                    if (!n) return e;
                    var r, o = function (t) {
                        return (t = t.split("."))[t.length - 1]
                    }(t);
                    for (r in e) i[r] = e[r];
                    for (r in e.prototype) i.prototype[r] = e.prototype[r];
                    return i
                }
                oh(vc.prototype, {
                        Va: {
                            name: "applyActionCode",
                            j: [$c("code")]
                        },
                        Ja: {
                            name: "checkActionCode",
                            j: [$c("code")]
                        },
                        Xa: {
                            name: "confirmPasswordReset",
                            j: [$c("code"), $c("newPassword")]
                        },
                        ub: {
                            name: "createUserWithEmailAndPassword",
                            j: [$c("email"), $c("password")]
                        },
                        Sb: {
                            name: "createUserAndRetrieveDataWithEmailAndPassword",
                            j: [$c("email"), $c("password")]
                        },
                        Vb: {
                            name: "fetchProvidersForEmail",
                            j: [$c("email")]
                        },
                        Wb: {
                            name: "fetchSignInMethodsForEmail",
                            j: [$c("email")]
                        },
                        fa: {
                            name: "getRedirectResult",
                            j: []
                        },
                        kc: {
                            name: "isSignInWithEmailLink",
                            j: [$c("emailLink")]
                        },
                        rc: {
                            name: "onAuthStateChanged",
                            j: [rh(Qc(), th(), "nextOrObserver"), th("opt_error", !0), th("opt_completed", !0)]
                        },
                        sc: {
                            name: "onIdTokenChanged",
                            j: [rh(Qc(), th(), "nextOrObserver"), th("opt_error", !0), th("opt_completed", !0)]
                        },
                        hb: {
                            name: "sendPasswordResetEmail",
                            j: [$c("email"), rh(Qc("opt_actionCodeSettings", !0), eh(null, !0), "opt_actionCodeSettings", !0)]
                        },
                        ib: {
                            name: "sendSignInLinkToEmail",
                            j: [$c("email"), Qc("actionCodeSettings")]
                        },
                        jb: {
                            name: "setPersistence",
                            j: [$c("persistence")]
                        },
                        Oa: {
                            name: "signInAndRetrieveDataWithCredential",
                            j: [nh()]
                        },
                        Pa: {
                            name: "signInAnonymously",
                            j: []
                        },
                        Dc: {
                            name: "signInAnonymouslyAndRetrieveData",
                            j: []
                        },
                        Ec: {
                            name: "signInWithCredential",
                            j: [nh()]
                        },
                        Jb: {
                            name: "signInWithCustomToken",
                            j: [$c("token")]
                        },
                        Bc: {
                            name: "signInAndRetrieveDataWithCustomToken",
                            j: [$c("token")]
                        },
                        Kb: {
                            name: "signInWithEmailAndPassword",
                            j: [$c("email"), $c("password")]
                        },
                        Fc: {
                            name: "signInWithEmailLink",
                            j: [$c("email"), $c("emailLink", !0)]
                        },
                        Cc: {
                            name: "signInAndRetrieveDataWithEmailAndPassword",
                            j: [$c("email"), $c("password")]
                        },
                        Gc: {
                            name: "signInWithPhoneNumber",
                            j: [$c("phoneNumber"), ih()]
                        },
                        Hc: {
                            name: "signInWithPopup",
                            j: [{
                                name: "authProvider",
                                K: "a valid Auth provider",
                                optional: !1,
                                M: function (t) {
                                    return !!(t && t.providerId && t.hasOwnProperty && t.hasOwnProperty("isOAuthProvider"))
                                }
                            }]
                        },
                        Ic: {
                            name: "signInWithRedirect",
                            j: [{
                                name: "authProvider",
                                K: "a valid Auth provider",
                                optional: !1,
                                M: function (t) {
                                    return !!(t && t.providerId && t.hasOwnProperty && t.hasOwnProperty("isOAuthProvider"))
                                }
                            }]
                        },
                        Oc: {
                            name: "updateCurrentUser",
                            j: [rh({
                                name: "user",
                                K: "an instance of Firebase User",
                                optional: !1,
                                M: function (t) {
                                    return !!(t && t instanceof Ru)
                                }
                            }, eh(), "user")]
                        },
                        kb: {
                            name: "signOut",
                            j: []
                        },
                        toJSON: {
                            name: "toJSON",
                            j: [$c(null, !0)]
                        },
                        Qc: {
                            name: "useDeviceLanguage",
                            j: []
                        },
                        Rc: {
                            name: "verifyPasswordResetCode",
                            j: [$c("code")]
                        }
                    }), ah(vc.prototype, {
                        lc: {
                            name: "languageCode",
                            qb: rh($c(), eh(), "languageCode")
                        }
                    }), vc.Persistence = Cs, vc.Persistence.LOCAL = "local", vc.Persistence.SESSION = "session", vc.Persistence.NONE = "none", oh(Ru.prototype, {
                        delete: {
                            name: "delete",
                            j: []
                        },
                        ac: {
                            name: "getIdTokenResult",
                            j: [Zc("opt_forceRefresh", !0)]
                        },
                        F: {
                            name: "getIdToken",
                            j: [Zc("opt_forceRefresh", !0)]
                        },
                        ab: {
                            name: "linkAndRetrieveDataWithCredential",
                            j: [nh()]
                        },
                        mc: {
                            name: "linkWithCredential",
                            j: [nh()]
                        },
                        nc: {
                            name: "linkWithPhoneNumber",
                            j: [$c("phoneNumber"), ih()]
                        },
                        oc: {
                            name: "linkWithPopup",
                            j: [{
                                name: "authProvider",
                                K: "a valid Auth provider",
                                optional: !1,
                                M: function (t) {
                                    return !!(t && t.providerId && t.hasOwnProperty && t.hasOwnProperty("isOAuthProvider"))
                                }
                            }]
                        },
                        pc: {
                            name: "linkWithRedirect",
                            j: [{
                                name: "authProvider",
                                K: "a valid Auth provider",
                                optional: !1,
                                M: function (t) {
                                    return !!(t && t.providerId && t.hasOwnProperty && t.hasOwnProperty("isOAuthProvider"))
                                }
                            }]
                        },
                        cb: {
                            name: "reauthenticateAndRetrieveDataWithCredential",
                            j: [nh()]
                        },
                        vc: {
                            name: "reauthenticateWithCredential",
                            j: [nh()]
                        },
                        wc: {
                            name: "reauthenticateWithPhoneNumber",
                            j: [$c("phoneNumber"), ih()]
                        },
                        xc: {
                            name: "reauthenticateWithPopup",
                            j: [{
                                name: "authProvider",
                                K: "a valid Auth provider",
                                optional: !1,
                                M: function (t) {
                                    return !!(t && t.providerId && t.hasOwnProperty && t.hasOwnProperty("isOAuthProvider"))
                                }
                            }]
                        },
                        yc: {
                            name: "reauthenticateWithRedirect",
                            j: [{
                                name: "authProvider",
                                K: "a valid Auth provider",
                                optional: !1,
                                M: function (t) {
                                    return !!(t && t.providerId && t.hasOwnProperty && t.hasOwnProperty("isOAuthProvider"))
                                }
                            }]
                        },
                        reload: {
                            name: "reload",
                            j: []
                        },
                        gb: {
                            name: "sendEmailVerification",
                            j: [rh(Qc("opt_actionCodeSettings", !0), eh(null, !0), "opt_actionCodeSettings", !0)]
                        },
                        toJSON: {
                            name: "toJSON",
                            j: [$c(null, !0)]
                        },
                        Nc: {
                            name: "unlink",
                            j: [$c("provider")]
                        },
                        mb: {
                            name: "updateEmail",
                            j: [$c("email")]
                        },
                        nb: {
                            name: "updatePassword",
                            j: [$c("password")]
                        },
                        Pc: {
                            name: "updatePhoneNumber",
                            j: [nh("phone")]
                        },
                        ob: {
                            name: "updateProfile",
                            j: [Qc("profile")]
                        }
                    }), oh(_c.prototype, {
                        execute: {
                            name: "execute"
                        },
                        render: {
                            name: "render"
                        },
                        reset: {
                            name: "reset"
                        },
                        getResponse: {
                            name: "getResponse"
                        }
                    }), oh(Nc.prototype, {
                        execute: {
                            name: "execute"
                        },
                        render: {
                            name: "render"
                        },
                        reset: {
                            name: "reset"
                        },
                        getResponse: {
                            name: "getResponse"
                        }
                    }), oh(vt.prototype, {
                        ia: {
                            name: "finally"
                        },
                        s: {
                            name: "catch"
                        },
                        then: {
                            name: "then"
                        }
                    }), ah(Iu.prototype, {
                        appVerificationDisabled: {
                            name: "appVerificationDisabledForTesting",
                            qb: Zc("appVerificationDisabledForTesting")
                        }
                    }), oh(Tu.prototype, {
                        confirm: {
                            name: "confirm",
                            j: [$c("verificationCode")]
                        }
                    }), sh(Rr, "credential", function (t, e) {
                        return new Pr(t, e)
                    }, [$c("email"), $c("password")]), oh(Tr.prototype, {
                        ta: {
                            name: "addScope",
                            j: [$c("scope")]
                        },
                        Da: {
                            name: "setCustomParameters",
                            j: [Qc("customOAuthParameters")]
                        }
                    }), sh(Tr, "credential", Ar, [rh($c(), Qc(), "token")]), sh(Rr, "credentialWithLink", Cr, [$c("email"), $c("emailLink")]), oh(Er.prototype, {
                        ta: {
                            name: "addScope",
                            j: [$c("scope")]
                        },
                        Da: {
                            name: "setCustomParameters",
                            j: [Qc("customOAuthParameters")]
                        }
                    }), sh(Er, "credential", Sr, [rh($c(), Qc(), "token")]), oh(kr.prototype, {
                        ta: {
                            name: "addScope",
                            j: [$c("scope")]
                        },
                        Da: {
                            name: "setCustomParameters",
                            j: [Qc("customOAuthParameters")]
                        }
                    }), sh(kr, "credential", Nr, [rh($c(), rh(Qc(), eh()), "idToken"), rh($c(), eh(), "accessToken", !0)]), oh(_r.prototype, {
                        Da: {
                            name: "setCustomParameters",
                            j: [Qc("customOAuthParameters")]
                        }
                    }), sh(_r, "credential", Or, [rh($c(), Qc(), "token"), $c("secret", !0)]), oh(Ir.prototype, {
                        ta: {
                            name: "addScope",
                            j: [$c("scope")]
                        },
                        credential: {
                            name: "credential",
                            j: [rh($c(), eh(), "idToken", !0), rh($c(), eh(), "accessToken", !0)]
                        },
                        Da: {
                            name: "setCustomParameters",
                            j: [Qc("customOAuthParameters")]
                        }
                    }), sh(Mr, "credential", jr, [$c("verificationId"), $c("verificationCode")]), oh(Mr.prototype, {
                        Ta: {
                            name: "verifyPhoneNumber",
                            j: [$c("phoneNumber"), ih()]
                        }
                    }), oh(ji.prototype, {
                        toJSON: {
                            name: "toJSON",
                            j: [$c(null, !0)]
                        }
                    }), oh(Gr.prototype, {
                        toJSON: {
                            name: "toJSON",
                            j: [$c(null, !0)]
                        }
                    }), oh(Wr.prototype, {
                        toJSON: {
                            name: "toJSON",
                            j: [$c(null, !0)]
                        }
                    }), oh(zc.prototype, {
                        clear: {
                            name: "clear",
                            j: []
                        },
                        render: {
                            name: "render",
                            j: []
                        },
                        verify: {
                            name: "verify",
                            j: []
                        }
                    }),
                    function () {
                        if (void 0 === e || !e.INTERNAL || !e.INTERNAL.registerService) throw Error("Cannot find the firebase namespace; be sure to include firebase-app.js before this library.");
                        var t = {
                            Auth: vc,
                            Error: ji
                        };
                        sh(t, "EmailAuthProvider", Rr, []), sh(t, "FacebookAuthProvider", Tr, []), sh(t, "GithubAuthProvider", Er, []), sh(t, "GoogleAuthProvider", kr, []), sh(t, "TwitterAuthProvider", _r, []), sh(t, "OAuthProvider", Ir, [$c("providerId")]), sh(t, "PhoneAuthProvider", Mr, [{
                            name: "auth",
                            K: "an instance of Firebase Auth",
                            optional: !0,
                            M: function (t) {
                                return !!(t && t instanceof vc)
                            }
                        }]), sh(t, "RecaptchaVerifier", zc, [rh($c(), {
                            name: "",
                            K: "an HTML element",
                            optional: !1,
                            M: function (t) {
                                return !!(t && t instanceof Element)
                            }
                        }, "recaptchaContainer"), Qc("recaptchaParameters", !0), {
                            name: "app",
                            K: "an instance of Firebase App",
                            optional: !0,
                            M: function (t) {
                                return !!(t && t instanceof e.app.App)
                            }
                        }]), e.INTERNAL.registerService("auth", function (t, e) {
                            return e({
                                INTERNAL: {
                                    getUid: g((t = new vc(t)).getUid, t),
                                    getToken: g(t.$b, t),
                                    addAuthTokenListener: g(t.Rb, t),
                                    removeAuthTokenListener: g(t.zc, t)
                                }
                            }), t
                        }, t, function (t, e) {
                            if ("create" === t) try {
                                e.auth()
                            } catch (t) {}
                        }), e.INTERNAL.extendNamespace({
                            User: Ru
                        })
                    }()
            }.call("undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
    } catch (t) {
        throw console.error(t), new Error("Cannot instantiate firebase-auth - be sure to load firebase-app.js first.")
    }
}(this.firebase = this.firebase || {}, firebase);
//# sourceMappingURL=firebase-auth.js.map