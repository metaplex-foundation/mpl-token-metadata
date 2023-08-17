mod generated;
pub use generated::*;

pub mod hooked;

pub fn clean(value: String) -> String {
    value.replace('\0', "")
}
