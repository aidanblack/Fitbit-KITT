function fitbitKittSettings(props) {
    return (
        <Page>
            <Section
                title={<Text bold>Fitbit KITT Settings</Text>}>
                <Select
                    label={`Temperature Unit`}
                    settingsKey="tempUnit"
                    options={[
                        { name: "Celsius" },
                        { name: "Farenheit" }
                    ]}
                />
            </Section>
        </Page>
    );
}

registerSettingsPage(fitbitKittSettings);