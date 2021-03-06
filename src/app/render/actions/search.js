/* Exports search related action creators */
import Client from "app/utils/client";
import {
    isPageRequested,
    getCurrentPage,
    getQuery,
    getResult,
    getError,
    isSearching
} from "app/render/selectors/search";

export const START_SEARCH = "START_SEARCH";
export const RECEIVE_RESULTS = "RECEIVE_RESULTS";
export const ERROR_SEARCH = "ERROR_SEARCH";
export const CLEAR_CACHE = "CLEAR_CACHE";

// Clears results cache in store
function clearCache() {
    return {
        type: CLEAR_CACHE
    };
}

// Used to denote the beginning of a search query
// query contains search, param and page
function startSearch(query) {
    if (!query.page) query.page = 1;
    return {
        type: START_SEARCH,
        query: {
            page: 1,
            param: "default",
            ...query
        }
    };
}

// Used to denote the end of search query
// query contains search, param and page
function receiveResults(query, results) {
    return {
        type: RECEIVE_RESULTS,
        query: {
            page: 1,
            param: "default",
            ...query
        },
        results
    };
}

// Dispatched if error occured during search
function errorSearch(query, error) {
    return {
        type: ERROR_SEARCH,
        query: {
            page: 1,
            param: "default",
            ...query
        },
        error
    };
}

// query contains search, param and page
// Used to do a fresh fetch of results. If different pages of same search
// is required then use fetchResultPage
export function search(query) {
    return dispatch => {
        // Clear cache since new search
        dispatch(clearCache());

        // Starting search
        dispatch(startSearch(query));

        Client()
            .search(query.search, query.page, query.param)
            .then(results => {
                dispatch(receiveResults(query, results));
            })
            .catch(err => {
                dispatch(errorSearch(query, err));
            });
    };
}

// Fetch current page + delta
// Uses cache if exists
export function fetchResultPage(delta) {
    return (dispatch, getState) => {
        // Get redux search state
        let state = getState();
        // Page to request
        let reqpage = getCurrentPage(state) + delta;
        // New search query
        let query = { ...getQuery(state), page: reqpage };

        // If reqpage retrieved without error already then don't fetch
        if (isPageRequested(state, reqpage) && !getError(state, reqpage)) {
            // we emulate a request and recieve using cached data
            // this ensures that state is updated properly without explicit
            // changes
            dispatch(startSearch(query));

            if (!isSearching(state, reqpage)) {
                // Dispatch recieve results only if the page request is
                // completed
                let results = getResult(state, reqpage);
                dispatch(receiveResults(query, results));
            }
        } else {
            // If the required page is not already fetched then fetch it
            // Starting search
            dispatch(startSearch(query));

            Client()
                .search(query.search, query.page, query.param)
                .then(results => {
                    dispatch(receiveResults(query, results));
                })
                .catch(err => {
                    dispatch(errorSearch(query, err));
                });
        }
    };
}
