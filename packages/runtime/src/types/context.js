export var LifecyclePriority;
(function (LifecyclePriority) {
    LifecyclePriority[LifecyclePriority["CRITICAL"] = 1000] = "CRITICAL";
    LifecyclePriority[LifecyclePriority["HIGH"] = 800] = "HIGH";
    LifecyclePriority[LifecyclePriority["NORMAL"] = 500] = "NORMAL";
    LifecyclePriority[LifecyclePriority["LOW"] = 200] = "LOW";
    LifecyclePriority[LifecyclePriority["CLEANUP"] = 100] = "CLEANUP";
})(LifecyclePriority || (LifecyclePriority = {}));
export var RequestPhase;
(function (RequestPhase) {
    RequestPhase["RECEIVED"] = "received";
    RequestPhase["AUTHENTICATED"] = "authenticated";
    RequestPhase["AUTHORIZED"] = "authorized";
    RequestPhase["VALIDATED"] = "validated";
    RequestPhase["PROCESSING"] = "processing";
    RequestPhase["COMPLETED"] = "completed";
    RequestPhase["ERROR"] = "error";
})(RequestPhase || (RequestPhase = {}));
