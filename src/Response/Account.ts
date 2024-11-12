import { AccountProfile } from "./AccountProfile";
import { SiteDetails } from "./SiteDetails";

export interface Account {
    userDetails: AccountProfile;
    siteDetails: Record<string, SiteDetails>[];
}
