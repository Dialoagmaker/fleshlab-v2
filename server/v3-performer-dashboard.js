/**
 * Performer dashboard projection.
 *
 * This is deliberately composed from the existing, ownership-scoped V3
 * services. It is not a second performer or creator data store and it does
 * not expose private storage references or admin-only records.
 */
export async function performerDashboard({ user, creators, submissions, contracts, production, commerce, compensation }) {
  const [creator, identity, submissionList, contractList, productionList, calendarList, commerceOverview, statement] = await Promise.all([
    creators.creatorForUser(user),
    submissions.identity(user),
    submissions.listForCreator(user),
    contracts.creatorInstances(user),
    production.creatorProductions(user),
    production.creatorCalendar(user),
    commerce.creatorOverview(user),
    compensation.creatorStatement(user)
  ]);

  return {
    creator,
    identity,
    submissions: submissionList.records || [],
    contracts: contractList.records || [],
    contract_signing_enabled: Boolean(contractList.signing_enabled),
    productions: productionList.records || [],
    calendar: calendarList.records || [],
    commerce: commerceOverview,
    statement,
    data_state: {
      missions: 'LIVE_V3_MEDIA_AND_SUBMISSIONS',
      fan_analytics: 'NOT_CONNECTED_IN_V3',
      ai_producer: 'NOT_CONFIGURED',
      calendar: calendarList.records?.length ? 'CONFIRMED_EVENTS' : 'NO_CONFIRMED_EVENTS'
    },
    generated_at: new Date().toISOString()
  };
}
