var _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
    return typeof e
} : function (e) {
    return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
};
importScripts("https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js");
var deviceInfo = void 0,
    currentDevice = void 0;

function getTime() {
    return Date.now()
}
var requestFunctionCaller = {
    comment: comment,
    statusChange: statusChange,
    share: share,
    update: update,
    create: create
};

function requestHandlerResponse(e, t, n, o) {
    self.postMessage({
        type: e,
        code: t,
        msg: n,
        params: o
    })
}

function sendApiFailToMainThread(e) {
    requestHandlerResponse("apiFail", e.code, e)
}

function http(i) {
    return new Promise(function (n, o) {
        var r = new XMLHttpRequest;
        r.open(i.method, i.url, !0), r.setRequestHeader("X-Requested-With", "XMLHttpRequest"), r.setRequestHeader("Content-Type", "application/json"), r.setRequestHeader("Authorization", "Bearer " + i.token), "GET" !== i.method && (r.timeout = 15e3, r.ontimeout = function () {
            return o({
                code: 400,
                message: "Request Timed Out. Please Try Again Later"
            })
        }), r.onreadystatechange = function () {
            if (4 === r.readyState) {
                if (!r.status) return o({
                    code: 400,
                    message: "Please Make sure you have a working Internet Connection"
                });
                if (226 < r.status) {
                    var e = JSON.parse(r.response),
                        t = {
                            res: JSON.parse(r.response),
                            url: i.url,
                            data: i.data,
                            device: currentDevice,
                            message: e.message,
                            code: e.code
                        };
                    return o(t)
                }
                r.responseText ? n(JSON.parse(r.responseText)) : n("success")
            }
        }, r.send(i.body || null)
    })
}

function fetchServerTime(n, i) {
    return new Promise(function (t) {
        currentDevice = n.device;
        var e = JSON.parse(currentDevice),
            o = i.apiUrl + "now?deviceId=" + e.id + "&appVersion=" + e.appVersion + "&os=" + e.baseOs + "&deviceBrand=" + e.deviceBrand + "&deviceModel=" + e.deviceModel + "&registrationToken=" + n.registerToken,
            r = indexedDB.open(i.user.uid);
        r.onsuccess = function () {
            var e = r.result.transaction(["root"], "readwrite"),
                n = e.objectStore("root");
            n.get(i.user.uid).onsuccess = function (e) {
                var t = e.target.result;
                t && t.hasOwnProperty("officesRemoved") && t.officesRemoved && (t.officesRemoved.forEach(function (e) {
                    o = o + "&removeFromOffice=" + e.replace(" ", "%20")
                }), delete t.officesRemoved, n.put(t))
            }, e.oncomplete = function () {
                http({
                    method: "GET",
                    url: o,
                    body: null,
                    token: i.user.token
                }).then(function (e) {
                
                    true ? requestHandlerResponse("update-app", 200) : e.revokeSession ? requestHandlerResponse("revoke-session", 200) : (e.hasOwnProperty("removeFromOffice") && Array.isArray(e.removeFromOffice) && e.removeFromOffice.length && removeFromOffice(e.removeFromOffice, i.user), t({
                        ts: e.timestamp,
                        meta: i
                    }))
                }).catch(sendApiFailToMainThread)
            }
        }
    })
}

function instant(e, t) {
    http({
        method: "POST",
        url: t.apiUrl + "services/logs",
        body: e,
        token: t.user.token
    }).then(function (e) {
        console.log(e)
    }).catch(console.log)
}

function putServerTime(r) {
    return console.log(r), new Promise(function (t, e) {
        var o = indexedDB.open(r.meta.user.uid);
        o.onerror = function () {
            e(o.error.message)
        }, o.onsuccess = function () {
            var e = o.result.transaction(["root"], "readwrite"),
                n = e.objectStore("root");
            n.get(r.meta.user.uid).onsuccess = function (e) {
                var t = e.target.result;
                t.serverTime = r.ts - Date.now(), n.put(t)
            }, e.oncomplete = function () {
                requestHandlerResponse("nowValid", 200), t(r.meta)
            }
        }
    })
}

function comment(n, o) {
    return console.log(n), new Promise(function (e, t) {
        http({
            method: "POST",
            url: o.apiUrl + "activities/comment",
            body: JSON.stringify(n),
            token: o.user.token
        }).then(function () {
            e(!0)
        }).catch(sendApiFailToMainThread)
    })
}

function statusChange(n, o) {
    return new Promise(function (t, e) {
        http({
            method: "PATCH",
            url: o.apiUrl + "activities/change-status",
            body: JSON.stringify(n),
            token: o.user.token
        }).then(function (e) {
            instantUpdateDB(n, "status", o.user).then(function () {
                t(!0)
            }).catch(console.log)
        }).catch(sendApiFailToMainThread)
    })
}

function share(n, o) {
    return new Promise(function (t, e) {
        http({
            method: "PATCH",
            url: o.apiUrl + "activities/share",
            body: JSON.stringify(n),
            token: o.user.token
        }).then(function (e) {
            t(!0)
        }).catch(sendApiFailToMainThread)
    })
}

function update(n, o) {
    return new Promise(function (t, e) {
        http({
            method: "PATCH",
            url: o.apiUrl + "activities/update",
            body: JSON.stringify(n),
            token: o.user.token
        }).then(function (e) {
            instantUpdateDB(n, "update", o.user).then(function () {
                t(!0)
            })
        }).catch(sendApiFailToMainThread)
    })
}

function create(e, n) {
    console.log(e);
    var o = [];
    return e.forEach(function (e) {
        var t = {
            method: "POST",
            url: n.apiUrl + "activities/create",
            body: JSON.stringify(e),
            token: n.user.token
        };
        o.push(http(t))
    }), new Promise(function (e, t) {
        o.length && Promise.all(o).then(function () {
            e(!0)
        }).catch(sendApiFailToMainThread)
    })
}

function removeFromOffice(e, t) {
    removeActivity(e, t).then(function (e) {
        return removeFromListAndChildren(e)
    }).then(function (e) {
        return removeFromMapAndCalendar(e)
    }).then(function (e) {
        return removeFromSubscriptions(e)
    }).catch(function (e) {
        instant(JSON.stringify({
            message: e
        }))
    })
}

function removeActivity(s, a) {
    return new Promise(function (o, r) {
        var i = indexedDB.open(a.uid);
        i.onsuccess = function () {
            var e = i.result.transaction(["activity"], "readwrite"),
                t = e.objectStore("activity").index("office"),
                n = [];
            s.forEach(function (e) {
                t.openCursor(e).onsuccess = function (e) {
                    var t = e.target.result;
                    t && (n.push(t.value.activityId), t.delete().onsuccess = function () {
                        t.continue()
                    })
                }
            }), e.oncomplete = function () {
                o({
                    offices: s,
                    ids: n,
                    user: a
                })
            }, e.onerror = function () {
                r({
                    message: e.error.message
                })
            }
        }, i.onerror = function () {
            r({
                message: i.error.message
            })
        }
    })
}

function removeFromListAndChildren(s) {
    return new Promise(function (o, r) {
        var i = indexedDB.open(s.user.uid);
        i.onsuccess = function () {
            var e = i.result.transaction(["list", "children"], "readwrite"),
                t = e.objectStore("list"),
                n = e.objectStore("children");
            s.ids.forEach(function (e) {
                t.delete(e), n.delete(e)
            }), e.oncomplete = function () {
                o(s)
            }, e.onerror = function () {
                r({
                    message: e.error.message
                })
            }
        }, i.onerror = function () {
            r({
                message: i.error.message
            })
        }
    })
}

function removeFromMapAndCalendar(s) {
    return new Promise(function (o, r) {
        var i = indexedDB.open(s.user.uid);
        i.onsuccess = function () {
            var e = i.result.transaction(["map", "calendar"], "readwrite"),
                t = e.objectStore("map").index("activityId"),
                n = e.objectStore("calendar").index("activityId");
            deleteByIndex(t, s.ids), deleteByIndex(n, s.ids), e.oncomplete = function () {
                o(s)
            }, e.onerror = function () {
                r({
                    message: e.error.message
                })
            }
        }, i.onerror = function () {
            r({
                message: i.error.message
            })
        }
    })
}

function removeFromSubscriptions(o) {
    var r = indexedDB.open(o.user.uid);
    r.onsuccess = function () {
        var t = r.result,
            e = t.transaction(["subscriptions"], "readwrite"),
            n = e.objectStore("subscriptions").index("office");
        o.offices.forEach(function (e) {
            n.openCursor(e).onsuccess = function (e) {
                var t = e.target.result;
                t && (t.delete().onsuccess = function () {
                    t.continue()
                })
            }
        }), e.oncomplete = function () {
            var e = t.transaction(["root"], "readwrite"),
                n = e.objectStore("root");
            n.get(o.user.uid).onsuccess = function (e) {
                var t = e.target.result;
                t && (t.officesRemoved = o.offices, n.put(t))
            }, e.oncomplete = function () {
                requestHandlerResponse("removed-from-office", 200, o.offices)
            }, e.onerror = function () {
                instant({
                    message: e.error.message
                })
            }
        }, e.onerror = function () {
            instant({
                message: e.error.message
            })
        }
    }
}

function getUrlFromPhoto(e, t) {
    http({
        method: "POST",
        url: t.apiUrl + "services/images",
        body: JSON.stringify(e),
        token: t.user.token
    }).then(function (e) {
        requestHandlerResponse("notification", 200)
    }).catch(sendApiFailToMainThread)
}

function instantUpdateDB(i, s, e) {
    return new Promise(function (t, n) {
        var r = indexedDB.open(e.uid);
        r.onsuccess = function () {
            var e = r.result.transaction(["activity"], "readwrite"),
                o = e.objectStore("activity");
            o.get(i.activityId).onsuccess = function (e) {
                var t = e.target.result;
                if (t.editable = 0, "share" === s && (i.share.forEach(function (e) {
                        t.assignees.push(e)
                    }), o.put(t)), "update" === s) {
                    t.schedule = i.schedule, t.attachment = i.attachment;
                    for (var n = 0; n < t.venue.length; n++) t.venue[n].geopoint = {
                        _latitude: i.venue[n].geopoint.latitude,
                        _longitude: i.venue[n].geopoint.longitude
                    };
                    o.put(t)
                }
                "status" === s && (t[s] = i[s], o.put(t))
            }, e.oncomplete = function () {
                t(!0)
            }, e.onerror = function () {
                n(!0)
            }
        }
    })
}

function updateMap(o, r) {
    var t = indexedDB.open(r.user.uid);
    t.onsuccess = function () {
        var n = t.result,
            e = n.transaction(["map"], "readwrite");
        e.objectStore("map").index("activityId").openCursor(o.activityId).onsuccess = function (e) {
            var t = e.target.result;
            if (t) {
                var n = t.delete();
                t.continue(), n.onerror = function () {
                    instant({
                        message: n.error.message
                    })
                }
            }
        }, e.oncomplete = function () {
            var e = n.transaction(["map"], "readwrite"),
                t = e.objectStore("map");
            "check-in" !== o.template && o.venue.forEach(function (e) {
                t.add({
                    activityId: o.activityId,
                    latitude: e.geopoint._latitude,
                    longitude: e.geopoint._longitude,
                    location: e.location,
                    template: o.template,
                    address: e.address,
                    venueDescriptor: e.venueDescriptor,
                    status: o.status,
                    office: o.office,
                    hidden: o.hidden
                })
            }), e.onerror = function () {
                instant(JSON.stringify({
                    message: "" + e.error.message
                }), r.user)
            }
        }, e.onerror = function () {
            instant(JSON.stringify({
                message: "" + e.error.message
            }), r.user)
        }
    }
}

function updateCalendar(r, n) {
    var o = indexedDB.open(n.user.uid);
    o.onsuccess = function () {
        var e = o.result,
            t = e.transaction(["calendar"], "readwrite");
        t.objectStore("calendar").index("activityId").openCursor(r.activityId).onsuccess = function (e) {
            var t = e.target.result;
            if (t) {
                var n = t.delete();
                n.onerror = function () {
                    instant({
                        message: n.error.message
                    })
                }, t.continue()
            }
        }, t.oncomplete = function () {
            var o = e.transaction(["calendar"], "readwrite").objectStore("calendar");
            r.schedule.forEach(function (e) {
                var t = moment(e.startTime).toDate(),
                    n = moment(e.endTime).toDate();
                o.add({
                    activityId: r.activityId,
                    scheduleName: e.name,
                    timestamp: r.timestamp,
                    template: r.template,
                    hidden: r.hidden,
                    start: moment(t).format("YYYY-MM-DD"),
                    end: moment(n).format("YYYY-MM-DD"),
                    status: r.status,
                    office: r.office
                })
            }), t.onerror = function () {
                instant(JSON.stringify({
                    message: "" + t.error.message
                }), n.user)
            }
        }
    }
}

function putAttachment(o, r) {
    var i = indexedDB.open(r.user.uid);
    i.onsuccess = function () {
        var e = i.result.transaction(["children"], "readwrite"),
            t = e.objectStore("children"),
            n = {
                activityId: o.activityId,
                status: o.status,
                template: o.template,
                office: o.office,
                attachment: o.attachment
            };
        t.put(n), e.onerror = function () {
            instant(JSON.stringify({
                message: "" + e.error.message
            }), r.user)
        }
    }
}

function removeUserFromAssigneeInActivity(e, t) {
    if (t.length) {
        var n = e.transaction(["activity"], "readwrite"),
            r = n.objectStore("activity");
        t.forEach(function (o) {
            r.get(o.id).onsuccess = function (e) {
                var t = e.target.result;
                if (t) {
                    var n = t.assignees.indexOf(o.user); - 1 < n && (t.assignees.splice(n, 1), r.put(t))
                }
            }
        }), n.oncomplete = function () {
            console.log("user removed from assignee in activity where he once was if that activity existed")
        }
    }
}

function removeActivityFromDB(e, t, n) {
    if (t.length) {
        var o = e.transaction(["activity", "list", "children"], "readwrite"),
            r = o.objectStore("activity"),
            i = o.objectStore("list"),
            s = o.objectStore("children");
        t.forEach(function (e) {
            r.delete(e), i.delete(e), s.delete(e)
        }), o.oncomplete = function () {
            mapAndCalendarRemovalRequest(activitiesToRemove, n)
        }
    }
}

function mapAndCalendarRemovalRequest(o, e) {
    var r = indexedDB.open(e.user.uid);
    r.onsuccess = function () {
        var e = r.result.transaction(["calendar", "map"], "readwrite"),
            t = e.objectStore("calendar").index("activityId"),
            n = e.objectStore("map").index("activityId");
        deleteByIndex(t, o), deleteByIndex(n, o), e.oncomplete = function () {
            console.log("activity is removed from all stores")
        }, e.onerror = function () {
            instant({
                message: transaction.error.message
            })
        }
    }
}

function deleteByIndex(t, e) {
    e.forEach(function (e) {
        t.openCursor(e).onsuccess = function (e) {
            var t = e.target.result;
            t && (t.delete().onsuccess = function () {
                t.continue()
            })
        }
    })
}

function updateSubscription(s, a) {
    return new Promise(function (o, r) {
        var i = [],
            n = indexedDB.open(a.user.uid);
        n.onsuccess = function () {
            var e = n.result.transaction(["subscriptions"], "readwrite"),
                t = e.objectStore("subscriptions").index("officeTemplate");
            s.forEach(function (e) {
                t.openCursor([e.office, e.template]).onsuccess = function (e) {
                    var t = e.target.result;
                    t && (t.value.count && i.push(t.value), t.delete().onsuccess = function () {
                        console.log("deleted")
                    })
                }
            }), e.oncomplete = function () {
                var t = indexedDB.open(a.user.uid);
                t.onsuccess = function () {
                    var e = t.result.transaction(["subscriptions"], "readwrite"),
                        n = e.objectStore("subscriptions");
                    s.forEach(function (t) {
                        i.length && i.forEach(function (e) {
                            e.office === t.office && e.template === t.template && (t.count = e.count)
                        }), n.put(t), console.log("added")
                    }), e.oncomplete = function () {
                        o(!0)
                    }, e.onerror = function () {
                        r(e.error.message)
                    }
                }
            }, e.onerror = function () {
                r({
                    message: tx.error.message
                })
            }
        }
    })
}

function createListStore(s, a, t) {
    return new Promise(function (r, e) {
        var i = indexedDB.open(t.user.uid);
        i.onsuccess = function () {
            var t = i.result,
                e = t.transaction(["users"], "readwrite"),
                n = e.objectStore("users"),
                o = {
                    activityId: s.activityId,
                    secondLine: "",
                    count: a[s.activityId],
                    timestamp: s.timestamp,
                    activityName: s.activityName,
                    status: s.status
                };
            "string" == typeof s.creator && (o.creator = {
                number: s.creator,
                photo: ""
            }), "object" === _typeof(s.creator) && (o.creator = {
                number: s.creator.phoneNumber,
                photo: s.creator.photoURL
            }), s.assignees.forEach(function (e) {
                var t = {
                    mobile: e.phoneNumber,
                    displayName: e.displayName,
                    photoURL: e.photoURL
                };
                n.put(t)
            }), e.oncomplete = function () {
                var e = t.transaction(["list"], "readwrite"),
                    n = e.objectStore("list");
                n.get(s.activityId).onsuccess = function (e) {
                    var t = e.target.result;
                    o.createdTime = t ? t.createdTime : s.timestamp, n.put(o)
                }, e.oncomplete = function () {
                    r(!0)
                }
            }
        }
    })
}

function successResponse(s, a) {
    var c = indexedDB.open(a.user.uid),
        u = [],
        d = [];
    c.onsuccess = function () {
        var e = c.result,
            n = e.transaction("addendum", "readwrite").objectStore("addendum"),
            o = e.transaction(["activity", "addendum"], "readwrite").objectStore("activity"),
            r = {};
        s.addendum.forEach(function (e) {
            if (e.unassign && (e.user == a.user.phoneNumber ? u.push(e.activityId) : d.push({
                    id: e.activityId,
                    user: e.user
                })), e.isComment) {
                var t = e.activityId;
                r[t] = (r[t] || 0) + 1
            }
            n.add(e)
        }), removeActivityFromDB(e, u, a), removeUserFromAssigneeInActivity(e, d, a);
        for (var t = function (e) {
                var t = s.activities[e];
                t.canEdit, t.editable, o.put(t), updateMap(t, a), updateCalendar(t, a), putAttachment(t, a), 0 === t.hidden && createListStore(t, r, a).then(function () {
                    20 <= s.activities.length ? s.activities.length - e <= 20 && requestHandlerResponse("initFirstLoad", 200, {
                        activity: [t]
                    }) : requestHandlerResponse("initFirstLoad", 200, {
                        activity: [t]
                    })
                })
            }, i = s.activities.length; i--;) t(i);
        updateRoot(a, s).then(function () {
            updateSubscription(s.templates, a).then(function () {
                requestHandlerResponse("initFirstLoad", 200, {
                    template: !0
                })
            }).catch(function (e) {
                instant(JSON.stringify(e), a.user), requestHandlerResponse("initFirstLoad", 200, {
                    template: !0
                })
            })
        })
    }
}

function updateRoot(i, s) {
    return new Promise(function (t, o) {
        var r = indexedDB.open(i.user.uid);
        r.onsuccess = function () {
            var e = r.result.transaction(["root"], "readwrite"),
                n = e.objectStore("root");
            n.get(i.user.uid).onsuccess = function (e) {
                var t = e.target.result;
                t.fromTime = s.upto, n.put(t)
            }, e.oncomplete = function () {
                t(!0)
            }, e.onerror = function () {
                o(e.error.message)
            }
        }
    })
}

function updateIDB(r) {
    var i = indexedDB.open(r.user.uid);
    i.onsuccess = function () {
        var e = i.result.transaction(["root"]),
            t = e.objectStore("root"),
            n = void 0,
            o = void 0;
        t.get(r.user.uid).onsuccess = function (e) {
            n = e.target.result, o = n.fromTime
        }, e.oncomplete = function () {
            http({
                method: "GET",
                url: r.apiUrl + "read?from=" + o,
                data: null,
                token: r.user.token
            }).then(function (e) {
                e && successResponse(e, r)
            }).catch(sendApiFailToMainThread)
        }
    }
}
self.onmessage = function (e) {
    "now" !== e.data.type ? "instant" !== e.data.type ? "Null" !== e.data.type ? "backblaze" !== e.data.type ? requestFunctionCaller[e.data.type](e.data.body, e.data.meta).then(function (e) {
        e && requestHandlerResponse("notification", 200, "status changed successfully")
    }).catch(function (e) {
        console.log(e)
    }) : getUrlFromPhoto(e.data.body, e.data.meta) : updateIDB(e.data.meta) : instant(e.data.body, e.data.meta) : fetchServerTime(e.data.body, e.data.meta).then(putServerTime).then(updateIDB).catch(function (e) {
        instant({
            message: JSON.stringify(e),
            body: ""
        })
    })
};