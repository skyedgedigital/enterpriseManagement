/** Working days credited per 1 unit of earned leave (EL). */
export const LIVE_REGISTER_DAYS_PER_EL = 20;
/** Working days credited per 1 unit of casual leave (CL). */
export const LIVE_REGISTER_DAYS_PER_CL = 35;
/** Working days credited per 1 unit of festival leave (FL). */
export const LIVE_REGISTER_DAYS_PER_FL = 60;

export interface LiveRegisterLeaveEntitlements {
  earnedLeave: number;
  casualLeave: number;
  festivalLeave: number;
}

/**
 * Live register / leave checklist: EL, CL, and FL are derived only from **total qualifying days**
 * in the period (e.g. sum of present days for the year). Attendance EL/CL/FL balances are not used.
 *
 * All three buckets use `floor`, so a leave is only credited once the worker has
 * fully accumulated the required number of working days:
 * - **EL:** one per every 20 completed days → `floor(totalDays / 20)`
 * - **CL:** one per every 35 completed days → `floor(totalDays / 35)`
 * - **FL:** one per every 60 completed days → `floor(totalDays / 60)`
 *
 * Example: 65 days → 3 EL, 1 CL, 1 FL. An employee with fewer than 20 / 35 / 60
 * working days in the period is therefore not entitled to any EL / CL / FL
 * respectively (prior revisions used `ceil` on CL, which wrongly granted 1 CL
 * to anyone with even a single day of work).
 */
export function computeLiveRegisterLeaveEntitlements(
  totalDays: number,
): LiveRegisterLeaveEntitlements {
  const d = Math.max(0, Number(totalDays) || 0);
  return {
    earnedLeave: Math.floor(d / LIVE_REGISTER_DAYS_PER_EL),
    casualLeave: Math.floor(d / LIVE_REGISTER_DAYS_PER_CL),
    festivalLeave: Math.floor(d / LIVE_REGISTER_DAYS_PER_FL),
  };
}
