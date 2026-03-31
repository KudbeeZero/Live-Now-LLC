// Live Now Recovery — Backend Canister
// Ohio Region 13 | Privacy-by-Design
//
// HARD RULES ENFORCED HERE:
//   - NO PHI stored. Providers identified by opaque Text id only.
//   - THE 4-HOUR DECAY: getEmergencyActive() rejects any lastVerified > 14400s ago.

import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";

actor LiveNowBackend {

  // ── Types ────────────────────────────────────────────────────────────────────

  public type ProviderStatus = {
    #Live;
    #Offline;
    #Unknown;   // emitted when lastVerified is stale (> 4 hours)
  };

  public type Provider = {
    id           : Text;
    name         : Text;       // clinic/organization name — NOT a patient name
    lat          : Float;
    lng          : Float;
    isLive       : Bool;
    lastVerified : Int;        // nanoseconds since epoch (Time.now())
  };

  public type ProviderView = {
    id     : Text;
    name   : Text;
    lat    : Float;
    lng    : Float;
    status : ProviderStatus;
  };

  // ── Constants ────────────────────────────────────────────────────────────────

  // 4-hour decay in nanoseconds (4 * 3600 * 1_000_000_000)
  let DECAY_NS : Int = 14_400_000_000_000;

  // ── Stable State ─────────────────────────────────────────────────────────────
  // Stable arrays used for upgrade persistence; HashMap rebuilt on init/upgrade.

  stable var providerEntries : [(Text, Provider)] = [];

  var providers : HashMap.HashMap<Text, Provider> =
    HashMap.fromIter(providerEntries.vals(), 0, Text.equal, Text.hash);

  // ── Upgrade Hooks ────────────────────────────────────────────────────────────

  system func preupgrade() {
    providerEntries := Iter.toArray(providers.entries());
  };

  system func postupgrade() {
    providers := HashMap.fromIter(providerEntries.vals(), 0, Text.equal, Text.hash);
    providerEntries := [];
  };

  // ── Seed Data (Northeast Ohio — fictional clinic names, real-ish coords) ─────

  let seedProviders : [Provider] = [
    { id = "p1"; name = "Cleveland Recovery Alliance";   lat = 41.4993; lng = -81.6944; isLive = true;  lastVerified = Time.now() },
    { id = "p2"; name = "Lakewood MAT Center";           lat = 41.4820; lng = -81.7982; isLive = true;  lastVerified = Time.now() },
    { id = "p3"; name = "Akron Hope Clinic";             lat = 41.0814; lng = -81.5190; isLive = false; lastVerified = Time.now() },
    { id = "p4"; name = "Parma Treatment Services";      lat = 41.3845; lng = -81.7229; isLive = true;  lastVerified = Time.now() },
    { id = "p5"; name = "Euclid Recovery House";         lat = 41.5931; lng = -81.5268; isLive = false; lastVerified = Time.now() },
    { id = "p6"; name = "Lorain County MAT Partners";   lat = 41.4529; lng = -82.1824; isLive = true;  lastVerified = Time.now() },
    { id = "p7"; name = "Medina Wellness Network";       lat = 41.1381; lng = -81.8637; isLive = false; lastVerified = Time.now() },
  ];

  // Populate seed data only if the map is empty (first deploy)
  if (providers.size() == 0) {
    for (p in seedProviders.vals()) {
      providers.put(p.id, p);
    };
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  func resolveStatus(p : Provider) : ProviderStatus {
    let age : Int = Time.now() - p.lastVerified;
    if (age > DECAY_NS) { #Unknown }
    else if (p.isLive)  { #Live    }
    else                { #Offline  }
  };

  func toView(p : Provider) : ProviderView {
    { id = p.id; name = p.name; lat = p.lat; lng = p.lng; status = resolveStatus(p) }
  };

  // ── Public API ───────────────────────────────────────────────────────────────

  /// Toggle a provider's live status and stamp lastVerified to now.
  /// No PHI involved — caller supplies only an opaque id and a boolean.
  public func toggleLive(id : Text, status : Bool) : async Bool {
    switch (providers.get(id)) {
      case null { false };
      case (?existing) {
        let updated : Provider = {
          id           = existing.id;
          name         = existing.name;
          lat          = existing.lat;
          lng          = existing.lng;
          isLive       = status;
          lastVerified = Time.now();
        };
        providers.put(id, updated);
        true
      };
    }
  };

  /// Returns only providers whose isLive == true AND lastVerified < 4 hours ago.
  /// THE 4-HOUR DECAY is enforced here — stale providers are excluded, not greenwashed.
  public query func getEmergencyActive() : async [ProviderView] {
    let all = Iter.toArray(providers.vals());
    let active = Array.filter<Provider>(all, func(p) {
      let age : Int = Time.now() - p.lastVerified;
      p.isLive and age <= DECAY_NS
    });
    Array.map<Provider, ProviderView>(active, toView)
  };

  /// Returns all providers with their resolved status (Live / Offline / Unknown).
  public query func getAllProviders() : async [ProviderView] {
    let all = Iter.toArray(providers.vals());
    Array.map<Provider, ProviderView>(all, toView)
  };

  /// Register a new provider (clinic-level, no PHI).
  public func registerProvider(id : Text, name : Text, lat : Float, lng : Float) : async Bool {
    switch (providers.get(id)) {
      case (?_) { false }; // already exists
      case null {
        let p : Provider = {
          id; name; lat; lng;
          isLive       = false;
          lastVerified = Time.now();
        };
        providers.put(id, p);
        true
      };
    }
  };
}
