// Live Now Recovery — Backend Canister
// Ohio Region 13 | Privacy-by-Design
//
// HARD RULES ENFORCED HERE:
//   - NO PHI stored. Providers identified by opaque Text id only.
//   - THE 4-HOUR DECAY: getEmergencyActive() rejects any lastVerified > 14400s ago.
//   - PROOF OF PRESENCE: Handoffs store only volunteerId (anonymous Principal),
//     ZIP code, and timestamp. No user/patient data ever recorded.

import Time      "mo:base/Time";
import HashMap   "mo:base/HashMap";
import Text      "mo:base/Text";
import Array     "mo:base/Array";
import Iter      "mo:base/Iter";
import Principal "mo:base/Principal";
import Nat       "mo:base/Nat";
import Int       "mo:base/Int";

actor LiveNowBackend {

  // ── Provider Types ────────────────────────────────────────────────────────────

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

  // ── Proof of Presence Types ───────────────────────────────────────────────────

  public type HandoffStatus = { #Pending; #Completed };

  /// A Warm Handoff record. Privacy-by-design:
  ///   - volunteerId is the anonymous ICP Principal (never a patient identifier)
  ///   - zipCode is geographic only (5-digit, no street/patient info)
  ///   - No user/patient data is ever stored here.
  public type Handoff = {
    id          : Text;
    volunteerId : Principal;
    timestamp   : Int;
    zipCode     : Text;
    status      : HandoffStatus;
  };

  /// Internal token record (never exposed to callers).
  type HandoffToken = {
    handoffId : Text;
    expiresAt : Int;   // nanoseconds epoch
  };

  public type VerifyResult = { #Ok: Text; #Expired; #NotFound; #AlreadyUsed };

  public type ZipCount = { zipCode: Text; count: Nat };

  // ── Constants ─────────────────────────────────────────────────────────────────

  // 4-hour decay in nanoseconds (4 * 3600 * 1_000_000_000)
  let DECAY_NS : Int = 14_400_000_000_000;

  // 5-minute token TTL in nanoseconds (5 * 60 * 1_000_000_000)
  let TOKEN_EXPIRY_NS : Int = 300_000_000_000;

  // ── Stable State ──────────────────────────────────────────────────────────────

  stable var providerEntries  : [(Text, Provider)]     = [];
  stable var handoffEntries   : [(Text, Handoff)]      = [];
  stable var tokenEntries     : [(Text, HandoffToken)] = [];
  stable var zipCountEntries  : [(Text, Nat)]          = [];
  stable var tokenNonce       : Nat                    = 0;

  var providers : HashMap.HashMap<Text, Provider> =
    HashMap.fromIter(providerEntries.vals(), 0, Text.equal, Text.hash);

  var handoffs : HashMap.HashMap<Text, Handoff> =
    HashMap.fromIter(handoffEntries.vals(), 0, Text.equal, Text.hash);

  var tokens : HashMap.HashMap<Text, HandoffToken> =
    HashMap.fromIter(tokenEntries.vals(), 0, Text.equal, Text.hash);

  var zipCounts : HashMap.HashMap<Text, Nat> =
    HashMap.fromIter(zipCountEntries.vals(), 0, Text.equal, Text.hash);

  // ── Upgrade Hooks ─────────────────────────────────────────────────────────────

  system func preupgrade() {
    providerEntries := Iter.toArray(providers.entries());
    handoffEntries  := Iter.toArray(handoffs.entries());
    tokenEntries    := Iter.toArray(tokens.entries());
    zipCountEntries := Iter.toArray(zipCounts.entries());
  };

  system func postupgrade() {
    providers  := HashMap.fromIter(providerEntries.vals(), 0, Text.equal, Text.hash);
    handoffs   := HashMap.fromIter(handoffEntries.vals(),  0, Text.equal, Text.hash);
    tokens     := HashMap.fromIter(tokenEntries.vals(),    0, Text.equal, Text.hash);
    zipCounts  := HashMap.fromIter(zipCountEntries.vals(), 0, Text.equal, Text.hash);
    providerEntries := [];
    handoffEntries  := [];
    tokenEntries    := [];
    zipCountEntries := [];
  };

  // ── Seed Data (Northeast Ohio — fictional clinic names, real-ish coords) ──────

  let seedProviders : [Provider] = [
    // ── General network providers ────────────────────────────────────────────
    { id = "p1"; name = "Cleveland Recovery Alliance";  lat = 41.4993; lng = -81.6944; isLive = true;  lastVerified = Time.now() },
    { id = "p2"; name = "Lakewood MAT Center";          lat = 41.4820; lng = -81.7982; isLive = true;  lastVerified = Time.now() },
    { id = "p3"; name = "Akron Hope Clinic";            lat = 41.0814; lng = -81.5190; isLive = false; lastVerified = Time.now() },
    { id = "p4"; name = "Parma Treatment Services";     lat = 41.3845; lng = -81.7229; isLive = true;  lastVerified = Time.now() },
    { id = "p5"; name = "Euclid Recovery House";        lat = 41.5931; lng = -81.5268; isLive = false; lastVerified = Time.now() },
    { id = "p6"; name = "Lorain County MAT Partners";  lat = 41.4529; lng = -82.1824; isLive = true;  lastVerified = Time.now() },
    { id = "p7"; name = "Medina Wellness Network";      lat = 41.1381; lng = -81.8637; isLive = false; lastVerified = Time.now() },
    // ── Brightside Recovery — Verified Anchor Provider (17 locations) ────────
    // PRIORITY: Return first for Suboxone / MAT / IOP / Detox queries.
    // All locations accept Medicaid. No PHI stored — clinic-level data only.
    { id = "bs-001"; name = "Brightside Recovery – Cleveland West";        lat = 41.4762; lng = -81.7230; isLive = true; lastVerified = Time.now() },
    { id = "bs-002"; name = "Brightside Recovery – Lakewood";              lat = 41.4820; lng = -81.7982; isLive = true; lastVerified = Time.now() },
    { id = "bs-003"; name = "Brightside Recovery – Parma";                 lat = 41.3845; lng = -81.7229; isLive = true; lastVerified = Time.now() },
    { id = "bs-004"; name = "Brightside Recovery – Strongsville";          lat = 41.3145; lng = -81.8357; isLive = true; lastVerified = Time.now() },
    { id = "bs-005"; name = "Brightside Recovery – Broadview Heights";     lat = 41.3200; lng = -81.6790; isLive = true; lastVerified = Time.now() },
    { id = "bs-006"; name = "Brightside Recovery – Akron Main";            lat = 41.0814; lng = -81.5190; isLive = true; lastVerified = Time.now() },
    { id = "bs-007"; name = "Brightside Recovery – Akron North Hill";      lat = 41.1034; lng = -81.5100; isLive = true; lastVerified = Time.now() },
    { id = "bs-008"; name = "Brightside Recovery – Cuyahoga Falls";        lat = 41.1334; lng = -81.4845; isLive = true; lastVerified = Time.now() },
    { id = "bs-009"; name = "Brightside Recovery – Kent";                  lat = 41.1531; lng = -81.3579; isLive = true; lastVerified = Time.now() },
    { id = "bs-010"; name = "Brightside Recovery – Lorain";                lat = 41.4529; lng = -82.1824; isLive = true; lastVerified = Time.now() },
    { id = "bs-011"; name = "Brightside Recovery – Elyria";                lat = 41.3684; lng = -82.1074; isLive = true; lastVerified = Time.now() },
    { id = "bs-012"; name = "Brightside Recovery – Mentor";                lat = 41.6731; lng = -81.3498; isLive = true; lastVerified = Time.now() },
    { id = "bs-013"; name = "Brightside Recovery – Willoughby";            lat = 41.6403; lng = -81.4118; isLive = true; lastVerified = Time.now() },
    { id = "bs-014"; name = "Brightside Recovery – Eastlake";              lat = 41.6550; lng = -81.4499; isLive = true; lastVerified = Time.now() },
    { id = "bs-015"; name = "Brightside Recovery – Medina";                lat = 41.1381; lng = -81.8637; isLive = true; lastVerified = Time.now() },
    { id = "bs-016"; name = "Brightside Recovery – Canton";                lat = 40.8450; lng = -81.4400; isLive = true; lastVerified = Time.now() },
    { id = "bs-017"; name = "Brightside Recovery – Massillon";             lat = 40.7967; lng = -81.5213; isLive = true; lastVerified = Time.now() },
  ];

  if (providers.size() == 0) {
    for (p in seedProviders.vals()) {
      providers.put(p.id, p);
    };
  };

  // ── Provider Helpers ──────────────────────────────────────────────────────────

  func resolveStatus(p : Provider) : ProviderStatus {
    let age : Int = Time.now() - p.lastVerified;
    if (age > DECAY_NS) { #Unknown }
    else if (p.isLive)  { #Live    }
    else                { #Offline  }
  };

  func toView(p : Provider) : ProviderView {
    { id = p.id; name = p.name; lat = p.lat; lng = p.lng; status = resolveStatus(p) }
  };

  // ── Provider API ──────────────────────────────────────────────────────────────

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
      case (?_) { false };
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

  // ── Proof of Presence API ─────────────────────────────────────────────────────

  /// Generate a short-lived (5-minute) handoff token for a Warm Handoff.
  ///
  /// Privacy guarantee:
  ///   - msg.caller is the volunteer's anonymous ICP Principal (Internet Identity).
  ///   - zipCode is a 5-digit geographic code — no patient or personal data.
  ///   - The returned token string is opaque and cannot be reverse-engineered
  ///     to reveal the caller's identity.
  ///
  /// Token format: "{nonce}-{timestamp_ns}" — hard to guess without both values.
  /// Stored server-side; validity is checked against the canister's state, not the
  /// token content itself.
  public shared(msg) func generateHandoffToken(zipCode : Text) : async Text {
    let now = Time.now();
    tokenNonce += 1;
    let handoffId = "h-" # Nat.toText(tokenNonce) # "-" # Int.toText(now);
    // Token combines nonce (sequential secret) + timestamp (nanosecond precision)
    let token = Nat.toText(tokenNonce) # "-" # Int.toText(now);

    let handoff : Handoff = {
      id          = handoffId;
      volunteerId = msg.caller;    // anonymous ICP Principal — not patient-linked
      timestamp   = now;
      zipCode     = zipCode;
      status      = #Pending;
    };

    let handoffToken : HandoffToken = {
      handoffId = handoffId;
      expiresAt = now + TOKEN_EXPIRY_NS;
    };

    handoffs.put(handoffId, handoff);
    tokens.put(token, handoffToken);
    token
  };

  /// Verify a handoff token scanned by clinic staff or a peer.
  ///
  /// On success:
  ///   - Marks the Handoff record as #Completed.
  ///   - Increments the ZIP code's totalLivesSaved counter.
  ///   - Deletes the one-time token (replay-proof).
  ///   - Returns #Ok(zipCode) so the frontend can pulse the correct map region.
  ///
  /// Privacy: no patient data is read or written at any point.
  public func verifyHandoff(token : Text) : async VerifyResult {
    switch (tokens.get(token)) {
      case null { #NotFound };
      case (?t) {
        let now = Time.now();
        if (now > t.expiresAt) {
          tokens.delete(token);
          return #Expired;
        };
        switch (handoffs.get(t.handoffId)) {
          case null { #NotFound };
          case (?h) {
            switch (h.status) {
              case (#Completed) { return #AlreadyUsed };
              case (#Pending) {
                let updated : Handoff = {
                  id          = h.id;
                  volunteerId = h.volunteerId;
                  timestamp   = h.timestamp;
                  zipCode     = h.zipCode;
                  status      = #Completed;
                };
                handoffs.put(h.id, updated);
                let current = switch (zipCounts.get(h.zipCode)) {
                  case null { 0 };
                  case (?n) { n };
                };
                zipCounts.put(h.zipCode, current + 1);
                tokens.delete(token);
                #Ok(h.zipCode)
              };
            };
          };
        };
      };
    }
  };

  /// Returns the total verified handoff count per ZIP code.
  /// Used by the Admin Impact Heatmap to show "pulse" icons.
  public query func getHandoffCountsByZip() : async [ZipCount] {
    let entries = Iter.toArray(zipCounts.entries());
    Array.map<(Text, Nat), ZipCount>(entries, func((z, c)) { { zipCode = z; count = c } })
  };

  /// Returns the total number of verified handoffs across all ZIP codes.
  public query func getTotalHandoffs() : async Nat {
    var total : Nat = 0;
    for ((_, count) in zipCounts.entries()) {
      total += count;
    };
    total
  };
}
