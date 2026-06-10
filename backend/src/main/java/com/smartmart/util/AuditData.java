package com.smartmart.util;

import java.util.StringJoiner;

public final class AuditData {
    private AuditData() {}

    public static String of(Object... values) {
        if (values == null || values.length == 0) {
            return null;
        }

        if (values.length % 2 != 0) {
            throw new IllegalArgumentException(
                    "Audit data phải chứa cặp key-value"
            );
        }

        StringJoiner result = new StringJoiner(", ");

        for (int i = 0; i < values.length; i += 2) {
            result.add(values[i] + "=" + String.valueOf(values[i + 1]));
        }

        return result.toString();
    }
}
