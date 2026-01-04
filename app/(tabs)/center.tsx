import { Redirect } from 'expo-router';

export default function CenterTab() {
    // This screen won't really be seen if the button is used for an action,
    // but we can redirect to Home or show a placeholder.
    return <Redirect href="/(tabs)/" />;
}
