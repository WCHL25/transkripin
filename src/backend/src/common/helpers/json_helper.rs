pub fn find_json_in_text(input: &str) -> Option<String> {
    let start = input.find('{')?;
    let end = input.rfind('}')?;
    Some(input[start..=end].to_string())
}
