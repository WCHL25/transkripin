use time::{ format_description::well_known::Rfc3339, OffsetDateTime };
use serde::Serializer;

use crate::common::constants::DEFAULT_NANOS_TIME;

pub fn serialize_timestamp<S>(timestamp_ns: &u64, serializer: S) -> Result<S::Ok, S::Error>
    where S: Serializer
{
    // Convert from nanoseconds to seconds
    let timestamp_s = *timestamp_ns / DEFAULT_NANOS_TIME;

    // Format the date as a string
    match OffsetDateTime::from_unix_timestamp(timestamp_s as i64) {
        Ok(date) => {
            let formatted_date = date
                .format(&Rfc3339)
                .unwrap_or_else(|_| "Invalid date".to_string());

            serializer.serialize_str(&formatted_date)
        }
        Err(_) => Err(serde::ser::Error::custom("Invalid timestamp format")),
    }
}
