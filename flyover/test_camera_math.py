import math

# Camera math test and validation

def get_flight_speed(t):
    # Normalized speed relative to cruise = 770 px/s
    # 0.0 at 0s
    # 0.5 by 0.6s
    # Hold 0.5 through 1.25s
    # Reach 1.0 by 1.6s
    # Remain between 0.94 and 1.1 through 7.3s
    # Ease down toward 0.12 by 8.3s
    if t < 0:
        return 0.0
    elif t <= 0.6:
        # smoothstep from 0 to 0.5
        s = t / 0.6
        return 0.5 * (3 * s**2 - 2 * s**3)
    elif t <= 1.25:
        return 0.5
    elif t <= 1.6:
        s = (t - 1.25) / (1.6 - 1.25)
        return 0.5 + 0.5 * (3 * s**2 - 2 * s**3)
    elif t <= 7.3:
        # subtle organic cruising variation between 0.96 and 1.04
        var = 0.04 * math.sin((t - 1.6) * 1.5)
        return 1.0 + var
    elif t <= 8.3:
        s = (t - 7.3) / (8.3 - 7.3)
        # ease down from ~1.0 to 0.12
        return 1.0 - (1.0 - 0.12) * (3 * s**2 - 2 * s**3)
    elif t <= 8.65:
        s = (t - 8.3) / (8.65 - 8.3)
        return 0.12 * (1.0 - (3 * s**2 - 2 * s**3))
    else:
        return 0.0

# Numerical integration for flight look-at Y
dt = 0.001
times = [i * dt for i in range(int(8.65 / dt) + 1)]
flight_Y = [420.0] # start at 420
for i in range(1, len(times)):
    t = times[i]
    spd = get_flight_speed(t) * 770.0
    flight_Y.append(flight_Y[-1] + spd * dt)

def get_integrated_flight_Y(t):
    idx = int(round(t / dt))
    if idx < 0: return 420.0
    if idx >= len(flight_Y): return flight_Y[-1]
    return flight_Y[idx]

print("--- Flight Look-at Target Y Check ---")
for t in [0.0, 0.6, 1.25, 1.6, 2.5, 3.0, 5.0, 6.3, 6.5, 7.3, 8.2, 8.65]:
    spd = get_flight_speed(t) * 770.0
    y = get_integrated_flight_Y(t)
    print(f"t={t:4.2f}s | Speed={spd:6.1f} px/s (rel {get_flight_speed(t):4.2f}) | Target Y={y:6.1f} px")

# Overhead zoom profile: 7.75s to 9.25s
# Trapezoid speed profile in log(dist):
# Accelerate: 7.75 - 8.35 (dur 0.60)
# Constant: 8.35 - 8.95 (dur 0.60)
# Decelerate: 8.95 - 9.25 (dur 0.30)
# Area under trapezoid = 0.5*0.6*v + 0.6*v + 0.5*0.3*v = (0.3 + 0.6 + 0.15)*v = 1.05*v
# Total delta ln(dist) = ln(dist_overhead) - ln(dist_flight_end)
# dist_flight_end = 1700
# dist_overhead = 11032
ln_dist_flight = math.log(1700.0)
ln_dist_overhead = math.log(11032.0)
delta_ln = ln_dist_overhead - ln_dist_flight
v_max = delta_ln / 1.05

def get_overhead_log_dist(t):
    if t <= 7.75:
        return ln_dist_flight
    elif t <= 8.35:
        s = (t - 7.75) / 0.60
        # integral of v_max * s = 0.5 * v_max * 0.60 * s^2
        return ln_dist_flight + 0.5 * 0.60 * v_max * s**2
    elif t <= 8.95:
        s = (t - 8.35)
        area_acc = 0.5 * 0.60 * v_max
        return ln_dist_flight + area_acc + v_max * s
    elif t <= 9.25:
        s = (t - 8.95) / 0.30
        area_acc = 0.5 * 0.60 * v_max
        area_const = 0.60 * v_max
        # integral of v_max * (1 - s) = v_max * 0.30 * (s - 0.5 * s^2)
        return ln_dist_flight + area_acc + area_const + v_max * 0.30 * (s - 0.5 * s**2)
    else:
        return ln_dist_overhead

print("\n--- Overhead Rise Zoom Check ---")
for t in [7.75, 8.0, 8.35, 8.65, 8.95, 9.1, 9.25]:
    lnd = get_overhead_log_dist(t)
    d = math.exp(lnd)
    print(f"t={t:4.2f}s | Camera Distance={d:7.1f} px | bottom edge on screen={1152/2 + (6267 - 3133.5)*(1880/d):5.1f} px")

print("\nMath test complete.")
