package com.jobtracker.config;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

public final class AppTimeZone {

    public static final ZoneId ZONE_ID = ZoneId.of("America/Chicago");

    private AppTimeZone() {
    }

    public static OffsetDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay(ZONE_ID).toOffsetDateTime();
    }

    public static OffsetDateTime startOfNextDay(LocalDate date) {
        return date.plusDays(1).atStartOfDay(ZONE_ID).toOffsetDateTime();
    }
}
