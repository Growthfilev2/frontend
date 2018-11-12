"use strict";
importScripts("https://www.gstatic.com/firebasejs/5.0.4/firebase-app.js"),
  importScripts("https://www.gstatic.com/firebasejs/5.0.4/firebase-auth.js"),
  importScripts(
    "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.js"
  );
var apiUrl = "https://us-central1-growthfile-207204.cloudfunctions.net/api/";
firebase.initializeApp({
  apiKey: "AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo",
  authDomain: "growthfile-207204.firebaseapp.com",
  databaseURL: "https://growthfile-207204.firebaseio.com",
  projectId: "growthfile-207204",
  storageBucket: "growthfile-207204.appspot.com",
  messagingSenderId: "701025551237"
});
function getTime() {
  return Date.now();
}
var requestFunctionCaller = {
  initializeIDB: initializeIDB,
  comment: comment,
  statusChange: statusChange,
  share: share,
  update: update,
  create: create,
  Null: Null,
  now: fetchServerTime
};
function requestHandlerResponse(a, b, c, d) {
  self.postMessage({ type: a, code: b, msg: c, params: d });
}
function createLog(a, b) {
  return { message: a, body: b };
}
self.onmessage = function(a) {
  firebase.auth().onAuthStateChanged(function() {
    return "now" === a.data.type
      ? void fetchServerTime(a.data.body)
          .then(initializeIDB)
          .then(updateIDB)
          .catch(console.log)
      : "instant" === a.data.type
        ? void instant(a.data.body)
        : void requestFunctionCaller[a.data.type](a.data.body)
            .then(updateIDB)
            .catch(console.log);
  });
};
function http(a, b, c) {
  return new Promise(function(d, e) {
    firebase
      .auth()
      .currentUser.getIdToken()
      .then(function(f) {
        var g = new XMLHttpRequest();
        g.open(a, b, !0),
          g.setRequestHeader("X-Requested-With", "XMLHttpRequest"),
          g.setRequestHeader("Content-Type", "application/json"),
          g.setRequestHeader("Authorization", "Bearer " + f),
          (g.onreadystatechange = function() {
            if (4 === g.readyState) {
              if (226 < g.status) {
                var h = JSON.parse(g.response);
                return 400 === g.status || 500 === g.status
                  ? e(JSON.parse(g.response))
                  : (requestHandlerResponse("error", h.code, h.message),
                    e(JSON.parse(g.response)));
              }
              if (!g.responseText) return d("success");
              d(JSON.parse(g.responseText));
            }
          }),
          g.send(c || null);
      })
      .catch(function(f) {
        instant(createLog(f.message));
      });
  });
}
function fetchServerTime(a) {
  console.log(a), (a = JSON.parse(a).split("&"));
  var b = { deviceId: a[0], brand: a[1], model: a[2], os: a[3] };
  return new Promise(function(c) {
    http("GET", apiUrl + "now?deviceId=" + b.deviceId)
      .then(function(d) {
        return (
          console.log(d),
          d.revokeSession
            ? void firebase
                .auth()
                .signOut()
                .then(
                  function() {
                    var e = indexedDB.deleteDatabase(
                      firebase.auth().currentUser.uid
                    );
                    (e.onsuccess = function() {
                      requestHandlerResponse("removeLocalStorage");
                    }),
                      (e.onerror = function() {
                        instant(createLog(error));
                      });
                  },
                  function(e) {
                    instant(createLog(e));
                  }
                )
            : void (console.log("continue"), c(d.timestamp))
        );
      })
      .catch(function(d) {
        instant(createLog(d.message, b));
      });
  });
}
function instant() {}
function fetchRecord(a, b) {
  return new Promise(function(c) {
    var d = indexedDB.open(a);
    d.onsuccess = function() {
      var f = d.result,
        g = f.transaction("activity").objectStore("activity");
      g.get(b).onsuccess = function(h) {
        c(h.target.result);
      };
    };
  });
}
function initializeIDB(a) {
  return (
    console.log("init db"),
    new Promise(function(b, c) {
      var d = firebase.auth().currentUser,
        e = indexedDB.open(d.uid);
      (e.onerror = function(f) {
        c(f.error);
      }),
        (e.onupgradeneeded = function() {
          var f = e.result;
          hasFirstView = !1;
          var g = f.createObjectStore("activity", { keyPath: "activityId" });
          g.createIndex("timestamp", "timestamp"),
            g.createIndex("office", "office"),
            g.createIndex("hidden", "hidden");
          var h = f.createObjectStore("users", { keyPath: "mobile" });
          h.createIndex("displayName", "displayName"),
            h.createIndex("isUpdated", "isUpdated"),
            h.createIndex("count", "count");
          var j = f.createObjectStore("addendum", { autoIncrement: !0 });
          j.createIndex("activityId", "activityId");
          var k = f.createObjectStore("activityCount", {
            keyPath: "activityId"
          });
          k.createIndex("count", "count");
          var l = f.createObjectStore("subscriptions", { autoIncrement: !0 });
          l.createIndex("office", "office"),
            l.createIndex("template", "template"),
            l.createIndex("officeTemplate", ["office", "template"]);
          var m = f.createObjectStore("calendar", { autoIncrement: !0 });
          m.createIndex("activityId", "activityId"),
            m.createIndex("timestamp", "timestamp"),
            m.createIndex("start", "start"),
            m.createIndex("end", "end"),
            m.createIndex("range", ["start", "end"]);
          var n = f.createObjectStore("map", { autoIncrement: !0 });
          n.createIndex("activityId", "activityId"),
            n.createIndex("location", "location"),
            n.createIndex("latitude", "latitude"),
            n.createIndex("longitude", "longitude"),
            n.createIndex("range", ["latitude", "longitude"]),
            n.createIndex("distance", "distance");
          var o = f.createObjectStore("children", { keyPath: "activityId" });
          o.createIndex("template", "template"),
            o.createIndex("office", "office");
          var p = f.createObjectStore("root", { keyPath: "uid" });
          p.put({ uid: d.uid, fromTime: 0, view: "list", provider: "" }),
            requestHandlerResponse("manageLocation");
        }),
        (e.onsuccess = function() {
          var f = e.result.transaction("root", "readwrite"),
            g = f.objectStore("root");
          (g.get(d.uid).onsuccess = function(h) {
            var j = h.target.result;
            (j.serverTime = a - Date.now()), g.put(j);
          }),
            (f.oncomplete = function() {
              b(d.uid);
            });
        });
    })
  );
}
function comment(a) {
  return (
    console.log(a),
    new Promise(function(b) {
      http("POST", apiUrl + "activities/comment", JSON.stringify(a))
        .then(function() {
          b(firebase.auth().currentUser.uid);
        })
        .catch(function(d) {
          instant(createLog(d.message));
        });
    })
  );
}
function statusChange(a) {
  console.log(a);
  var b = firebase.auth().currentUser.uid;
  return new Promise(function(c) {
    fetchRecord(b, a.activityId).then(function(e) {
      http("PATCH", apiUrl + "activities/change-status", JSON.stringify(a), e)
        .then(function() {
          instantUpdateDB(b, a, "status"),
            requestHandlerResponse(
              "notification",
              200,
              "status changed successfully",
              b
            ),
            c(firebase.auth().currentUser.uid);
        })
        .catch(function(f) {
          instant(createLog(f.message));
        });
    });
  });
}
function share(a) {
  var b = firebase.auth().currentUser.uid;
  return new Promise(function(c) {
    http("PATCH", apiUrl + "activities/share", JSON.stringify(a))
      .then(function() {
        instantUpdateDB(b, a, "share"),
          requestHandlerResponse(
            "notification",
            200,
            "assignne added successfully",
            b
          ),
          c(firebase.auth().currentUser.uid);
      })
      .catch(function(e) {
        instant(createLog(e.message, a));
      });
  });
}
function Null(a) {
  return new Promise(function(b, c) {
    var d = firebase.auth().currentUser;
    return d
      ? void (a &&
          "true" === a &&
          (console.log(JSON.parse(a)), requestHandlerResponse("reset-offset")),
        console.log("Null Ran"),
        b(d.uid))
      : void c(null);
  });
}
function update(a) {
  var b = firebase.auth().currentUser.uid;
  return (
    console.log(a),
    new Promise(function(c) {
      http("PATCH", apiUrl + "activities/update", JSON.stringify(a))
        .then(function() {
          instantUpdateDB(b, a, "update"),
            requestHandlerResponse(
              "notification",
              200,
              "activity update successfully",
              b
            ),
            c(firebase.auth().currentUser.uid);
        })
        .catch(function(e) {
          instant(createLog(e.message, a));
        });
    })
  );
}
function create(a) {
  return (
    console.log(a),
    new Promise(function(b) {
      http("POST", apiUrl + "activities/create", JSON.stringify(a))
        .then(function() {
          requestHandlerResponse(
            "notification",
            200,
            "activity created successfully",
            firebase.auth().currentUser.uid
          ),
            requestHandlerResponse(
              "redirect-to-list",
              200,
              "activity created successfully",
              firebase.auth().currentUser.uid
            ),
            b(firebase.auth().currentUser.uid);
        })
        .catch(function(d) {
          instant(createLog(d.message, a));
        });
    })
  );
}
function instantUpdateDB(a, b, c) {
  console.log(b);
  var d = indexedDB.open(a);
  d.onsuccess = function() {
    var f = d.result,
      g = f.transaction(["activity"], "readwrite"),
      h = g.objectStore("activity");
    (h.get(b.activityId).onsuccess = function(j) {
      var k = j.target.result;
      if (
        ((k.editable = 0),
        "share" === c &&
          (k.assignees.push(b.share[0]), h.put(k), console.log(k)),
        "update" === c)
      ) {
        var l = f.transaction("activity", "readwrite").objectStore("activity");
        l.get(b.activityId).onsuccess = function(m) {
          for (var o = m.target.result, n = 0; n < o.venue.length; n++)
            o.venue[n].geopoint = {
              _latitude: b.venue[n].geopoint._latitude,
              _longitude: b.venue[n].geopoint._longitude
            };
          l.put(o);
        };
      }
      "status" === c && ((k[c] = b[c]), h.put(k));
    }),
      (g.oncomplete = function() {
        ("status" === c || "update" === c) &&
          requestHandlerResponse(
            "redirect-to-list",
            200,
            "activity status changed"
          ),
          "share" === c &&
            requestHandlerResponse("updateAssigneesList", 200, "update user", {
              id: b.activityId,
              number: b.share[0]
            });
      });
  };
}
function resetInstantDB(a) {
  var b = firebase.auth().currentUser.uid,
    c = indexedDB.open(b);
  c.onsuccess = function() {
    var d = c.result,
      e = d.transaction("activity", "readwrite").objectStore("activity");
    console.log(a),
      (e.get(a.activityId).onsuccess = function(f) {
        var g = f.target.result;
        console.log(g),
          (g = a),
          console.log(g),
          e.put(g),
          requestHandlerResponse(
            "updateIDB",
            200,
            "activity updated to default state",
            b
          );
      });
  };
}
function updateMap(a, b) {
  var c = a.transaction(["map"], "readwrite"),
    d = c.objectStore("map"),
    e = d.index("activityId");
  (e.openCursor(b.activityId).onsuccess = function(f) {
    var g = f.target.result;
    if (g) {
      var h = g.delete();
      g.continue(), (h.onerror = errorDeletingRecord);
    }
  }),
    (c.oncomplete = function() {
      var f = a.transaction(["map"], "readwrite"),
        g = f.objectStore("map");
      b.venue.forEach(function(h) {
        g.add({
          activityId: b.activityId,
          latitude: h.geopoint._latitude,
          longitude: h.geopoint._longitude,
          location: h.location.toLowerCase(),
          template: b.template,
          address: h.address.toLowerCase(),
          venueDescriptor: h.venueDescriptor
        });
      });
    }),
    (c.onerror = errorDeletingRecord);
}
function errorDeletingRecord(a) {
  console.log(a.target.error);
}
function transactionError(a) {
  console.log(a.target.error);
}
function updateCalendar(a, b) {
  var c = a.transaction(["calendar"], "readwrite"),
    d = c.objectStore("calendar"),
    e = d.index("activityId");
  (e.openCursor(b.activityId).onsuccess = function(f) {
    var g = f.target.result;
    if (g) {
      var h = g.delete();
      (h.onerror = errorDeletingRecord), g.continue();
    }
  }),
    (c.oncomplete = function() {
      var f = a.transaction(["calendar"], "readwrite"),
        g = f.objectStore("calendar");
      b.schedule.forEach(function(h) {
        var j = moment(h.startTime).toDate(),
          k = moment(h.endTime).toDate();
        g.add({
          activityId: b.activityId,
          scheduleName: h.name,
          timestamp: b.timestamp,
          template: b.template,
          hidden: b.hidden,
          start: moment(j).format("YYYY-MM-DD"),
          end: moment(k).format("YYYY-MM-DD")
        });
      });
    }),
    (c.onerror = transactionError);
}
function putAttachment(a, b) {
  var c = a.transaction("children", "readwrite").objectStore("children");
  c.put({
    activityId: b.activityId,
    status: b.status,
    template: b.template,
    office: b.office,
    attachment: b.attachment
  });
}
function putAssignessInStore(a, b) {
  return -1 == b.indexOf(firebase.auth().currentUser.phoneNumber)
    ? void removeActivityFromDB(a)
    : void b.forEach(function(c) {
        var d = a.transaction("users", "readwrite").objectStore("users");
        d.openCursor(c).onsuccess = function(e) {
          var f = e.target.result;
          f || d.add({ mobile: c, isUpdated: 0, displayName: "" });
        };
      });
}
function removeActivityFromDB(a) {
  var b = [],
    c = a.transaction("activity", "readwrite").objectStore("activity"),
    d = firebase.auth().currentUser.phoneNumber;
  c.openCursor().onsuccess = function(e) {
    var f = e.target.result;
    return f
      ? void (-1 == f.value.assignees.indexOf(d) &&
          (b.push(f.value.activityId), f.delete()),
        f.continue())
      : void removeActivityFromKeyPath(b, "activityCount");
  };
}
function removeActivityFromKeyPath(a, b) {
  var c = firebase.auth().currentUser.uid,
    d = indexedDB.open(c);
  d.onsuccess = function() {
    var e = d.result,
      f = e.transaction(b, "readwrite").objectStore(b);
    a.forEach(function(g) {
      f.delete(g);
    }),
      "activityCount" === b && removeActivityFromCalendar(a, e);
  };
}
function removeActivityFromCalendar(a, b) {
  var c = b
      .transaction("calendar", "readwrite")
      .objectStore("calendar")
      .index("activityId"),
    d = 0;
  a.forEach(function(e) {
    d++,
      (c.openCursor(e).onsuccess = function(f) {
        var g = f.target.result;
        return g
          ? void (g.delete(), g.continue())
          : d === a.length
            ? void removeActivityFromMap(a)
            : void 0;
      });
  });
}
function removeActivityFromMap(a) {
  var b = firebase.auth().currentUser.uid,
    c = indexedDB.open(b),
    d = 0;
  c.onsuccess = function() {
    var e = c.result,
      f = e
        .transaction("map", "readwrite")
        .objectStore("map")
        .index("activityId");
    a.forEach(function(g) {
      d++,
        (f.openCursor(g).onsuccess = function(h) {
          var j = h.target.result;
          return j
            ? void (j.delete(), j.continue())
            : d === a.length
              ? (removeActivityFromKeyPath(a, "children"),
                void removeActivityFromAddendum(a))
              : void 0;
        });
    });
  };
}
function removeActivityFromAddendum(a) {
  var b = firebase.auth().currentUser.uid,
    c = indexedDB.open(b);
  c.onsuccess = function() {
    var d = c.result,
      e = d
        .transaction("addendum", "readwrite")
        .objectStore("addendum")
        .index("activityId");
    a.forEach(function(f) {
      e.openCursor(f).onsuccess = function(g) {
        var h = g.target.result;
        h && (h.delete(), h.continue());
      };
    });
  };
}
function createUsersApiUrl(a) {
  var b = a.transaction("users", "readwrite").objectStore("users"),
    c = b.index("isUpdated"),
    e = "",
    g = "";
  return new Promise(function(h) {
    c.openCursor(0).onsuccess = function(j) {
      var k = j.target.result;
      if (!k)
        return (
          (g = "" + (apiUrl + "services/users?q=") + e),
          void (e && h({ db: a, url: g }))
        );
      console.log(k.value.mobile);
      var l = "%2B" + k.value.mobile + "&q=";
      (e += "" + l.replace("+", "")), k.continue();
    };
  });
}
function updateUserObjectStore(a) {
  http("GET", a.url)
    .then(function(b) {
      if ((console.log(b), !!Object.keys(b).length)) {
        var c = a.db.transaction("users", "readwrite").objectStore("users"),
          d = c.index("isUpdated");
        d.openCursor(0).onsuccess = function(g) {
          var h = g.target.result;
          if (h) {
            if (b[h.primaryKey].displayName && b[h.primaryKey].photoURL) {
              var j = h.value;
              (j.photoURL = b[h.primaryKey].photoURL),
                (j.displayName = b[h.primaryKey].displayName),
                (j.isUpdated = 1),
                console.log(j),
                c.put(j);
            }
            h.continue();
          }
        };
      }
    })
    .catch(function(b) {
      instant(createLog(b.message, ""));
    });
}
function updateSubscription(a, b) {
  var c = a
      .transaction("subscriptions", "readwrite")
      .objectStore("subscriptions"),
    d = c.index("template");
  d.get(b.template).onsuccess = function(e) {
    return e.target.result
      ? void (d.openCursor(b.template).onsuccess = function(f) {
          var g = f.target.result;
          return b.office === g.value.office
            ? void (g.delete(), c.add(b))
            : void c.add(b);
        })
      : void c.add(b);
  };
}
var firstTime = 0;
function successResponse(a) {
  console.log("start success");
  var b = firebase.auth().currentUser,
    c = indexedDB.open(b.uid);
  c.onsuccess = function() {
    var d = c.result,
      e = d.transaction("addendum", "readwrite").objectStore("addendum"),
      f = d.transaction(["root"], "readwrite"),
      g = f.objectStore("root"),
      h = d.transaction(["activity"], "readwrite"),
      j = h.objectStore("activity"),
      k = d
        .transaction("activityCount", "readwrite")
        .objectStore("activityCount"),
      l = d.transaction(["activity", "root"]),
      m = {};
    firstTime++,
      a.addendum.forEach(function(o) {
        var p = o.activityId;
        (m[p] = (m[p] || 0) + 1), e.add(o);
      }),
      Object.keys(m).forEach(function(o) {
        k.put({ activityId: o, count: m[o] });
      });
    var n = [];
    a.activities.forEach(function(o) {
      o.canEdit ? ((o.editable = 1), j.put(o)) : ((o.editable = 0), j.put(o)),
        n.push(o.activityId),
        updateMap(d, o),
        updateCalendar(d, o),
        putAssignessInStore(d, o.assignees),
        putAttachment(d, o);
    }),
      a.templates.forEach(function(o) {
        updateSubscription(d, o);
      }),
      (g.get(b.uid).onsuccess = function(o) {
        var p = o.target.result;
        getUniqueOfficeCount(p.fromTime)
          .then(setUniqueOffice)
          .catch(console.log),
          (p.fromTime = a.upto),
          g.put(p),
          0 !== p.fromTime &&
            setTimeout(function() {
              requestHandlerResponse("updateIDB", 200);
            }, 2e3);
      }),
      createUsersApiUrl(d).then(
        updateUserObjectStore,
        notUpdateUserObjectStore
      );
  };
}
function notUpdateUserObjectStore(a) {
  console.log(a);
}
function getUniqueOfficeCount(a) {
  var b = firebase.auth().currentUser.uid,
    c = indexedDB.open(b),
    d = 0,
    e = [];
  return new Promise(function(f, g) {
    (c.onsuccess = function() {
      var h = c.result,
        j = h
          .transaction("activity")
          .objectStore("activity")
          .index("office");
      j.openCursor(null, "nextunique").onsuccess = function(k) {
        var l = k.target.result;
        return l
          ? void (e.push(l.value.office), d++, l.continue())
          : void f({ dbName: b, count: d, allOffices: e, firstTime: a });
      };
    }),
      (c.onerror = function(h) {
        g(h.error);
      });
  });
}
function setUniqueOffice(a) {
  var b = indexedDB.open(a.dbName),
    c = { hasMultipleOffice: "", allOffices: a.allOffices };
  b.onsuccess = function() {
    var d = b.result,
      e = d.transaction("root", "readwrite").objectStore("root");
    e.get(a.dbName).onsuccess = function(f) {
      var g = f.target.result;
      return 1 === a.count
        ? ((c.hasMultipleOffice = 0),
          (g.offices = c),
          e.put(g),
          void (
            0 === a.firstTime &&
            requestHandlerResponse("updateIDB", 200, "update successfull")
          ))
        : void ((c.hasMultipleOffice = 1),
          (g.offices = c),
          e.put(g),
          0 === a.firstTime &&
            requestHandlerResponse("updateIDB", 200, "update successfull"));
    };
  };
}
function updateIDB(a) {
  console.log(a);
  var b = indexedDB.open(a);
  b.onsuccess = function() {
    var c = b.result,
      d = c.transaction("root", "readonly").objectStore("root");
    d.get(a).onsuccess = function(e) {
      http("GET", apiUrl + "read?from=" + e.target.result.fromTime)
        .then(function(f) {
          console.log(f), successResponse(f);
        })
        .catch(function(f) {
          instant(createLog(f.message, e.target.result.fromTime));
        });
    };
  };
}
