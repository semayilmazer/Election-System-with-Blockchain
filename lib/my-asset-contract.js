/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class MyAssetContract extends Contract {

    async myValueExists(ctx, myId) {
        const buffer = await ctx.stub.getState(myId);
        return (!!buffer && buffer.length > 0);
    }

    async readMyValue(ctx, myId) {
        const exists = await this.myValueExists(ctx, myId);
        if (!exists) {
            throw new Error(`The value ${myId} does not exist`);
        }
        const buffer = await ctx.stub.getState(myId);
        const value = JSON.parse(buffer.toString());
        return value;
    }

    async createMyParty(ctx, myPartyId, value) { //If the party with the given id does not exist, a new party is created with the given value.
        const exists = await this.myValueExists(ctx, myPartyId);
        if (exists) {
            throw new Error(`The my party ${myPartyId} already exists`);
        }
        const party = { value };
        const buffer = Buffer.from(JSON.stringify(party));
        await ctx.stub.putState(myPartyId, buffer);
    }

    async createMyVoter(ctx, myVoterId, value) { //If the voter with the given id does not exist, a new voter is created with the given value.
        const exists = await this.myValueExists(ctx, myVoterId);
        if (exists) {
            throw new Error(`The my voter ${myVoterId} already exists`);
        }
        const voter = { value };
        const buffer = Buffer.from(JSON.stringify(voter));
        await ctx.stub.putState(myVoterId, buffer);
    }

    async createMyElection(ctx, myElectionId, value) {
        const exists = await this.myValueExists(ctx, myElectionId);
        if (exists) {
            throw new Error(`The my election ${myElectionId} already exists`);
        }
        const election = { value };
        const buffer = Buffer.from(JSON.stringify(election));
        await ctx.stub.putState(myElectionId, buffer);
    }

    async createMyVote(ctx, myElectionId, myVoterId, myPartyId) {
        const myVoteId = myElectionId + "/" + myVoterId;
        const voteCountId = myElectionId + myPartyId;
        const exists = await this.myValueExists(ctx, myVoteId);
        if (exists) {
            throw new Error(`Such voter ${myVoterId} has already used her/his vote the election ${myElectionId}!`);
        }
        const exists1 = await this.myValueExists(ctx, myElectionId);
        if (!exists1) {
            throw new Error(`Such election ${myElection} does not exist!`);
        }
        const exists2 = await this.myValueExists(ctx, myVoterId);
        if (!exists2) {
            throw new Error(`Such voter ${myVoterId} does not exist!`);
        }
        const exists3 = await this.myValueExists(ctx, myPartyId);
        if (!exists3) {
            throw new Error(`Such party ${myPartyId} does not exist!`);
        }
        const vote = { myElectionId,myPartyId };
        const buffer = Buffer.from(JSON.stringify(vote));
        await ctx.stub.putState(myVoteId, buffer);
    }

    async getAllVotesForParties(ctx, myElectionId, myPartyId) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.myElectionId = myElectionId;
        queryString.selector.myPartyId = myPartyId;

        let queryResults = await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
        return JSON.parse(queryResults.toString());
    }

    async getQueryResultForQueryString(ctx, queryString) {
        let resultsIterator = await ctx.stub.getQueryResult(queryString);
        let results = await this.getAllResults(resultsIterator, false);

        return Buffer.from(JSON.stringify(results));
    }

    async getAllResults(iterator, isHistory) {
        let allResults = [];
        for (; ;) {
            let res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));

                if (isHistory && isHistory === true) {
                    jsonRes.TxId = res.value.tx_id;
                    jsonRes.Timestamp = res.value.timestamp;
                    jsonRes.IsDelete = res.value.is_delete.toString();
                    try {
                        jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Value = res.value.value.toString('utf8');
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return allResults;
            }
        }
    }
}

module.exports = MyAssetContract;
