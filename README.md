> [!IMPORTANT]  
> Deze repository wordt niet meer gebruikt. Deze functionaliteit is vanaf nu opgenomen in [Mijn Nijmegen](https://github.com/GemeenteNijmegen/mijn-nijmegen).

# MIJN Zaken
Een applicatie voor het bekijken van je lopende zaken binnen de gemeente Nijmegen.

## Github workflows
Om de workflows (build, selfmutate, upgrade) te kunnen draaien is een token nodig met de naam PROJEN_GITHUB_TOKEN. Zie https://docs.github.com/en/actions/security-guides/automatic-token-authentication#granting-additional-permissions voor meer details.

## Installatie
Om de eerste keer te installeren moet een handmatige deploy gedaan worden. Zorg dat je naar de deployment-account deployt. Vanuit daar worden afhankelijk van de gekozen branch in de juiste account resources aangemaakt. Let op dat je environment de juiste branch moet hebben. Daarnaast moet je bij de eerste deploy de arn van de codestarConnection naar Github meegeven. Een voorbeeld:
``` 
export BRANCH_NAME=acceptance
export AWS_PROFILE=deployment
cdk deploy -a cdk.out --all
```
Vervolgens worden wijzigingen in de verbonden repository in de gekoppelde branche door de pipeline opgepakt.
