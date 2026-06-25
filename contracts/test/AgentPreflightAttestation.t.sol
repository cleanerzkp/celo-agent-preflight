// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {AgentPreflightAttestation} from "../src/AgentPreflightAttestation.sol";

contract AgentPreflightAttestationTest is Test {
    AgentPreflightAttestation private attestation;

    address private attester = makeAddr("attester");
    address private subject = makeAddr("subject");
    bytes32 private reportHash = keccak256("report");
    string private reportURI = "https://preflight.example/reports/0xabc.json";

    event AgentReportAttested(
        uint256 indexed agentId,
        address indexed subject,
        address indexed attester,
        bytes32 reportHash,
        uint16 score,
        string reportURI,
        uint64 timestamp
    );

    function setUp() public {
        attestation = new AgentPreflightAttestation();
    }

    function test_AttestAgentReportEmitsEvent() public {
        vm.warp(1_780_000_000);
        vm.prank(attester);
        vm.expectEmit(true, true, true, true);
        emit AgentReportAttested(42, subject, attester, reportHash, 87, reportURI, uint64(block.timestamp));

        attestation.attestAgentReport(42, subject, reportHash, 87, reportURI);
    }

    function test_AttestAgentReportStoresLatestByAgentId() public {
        vm.warp(1_780_000_000);
        vm.prank(attester);

        attestation.attestAgentReport(42, subject, reportHash, 87, reportURI);

        AgentPreflightAttestation.ReportPointer memory storedReport =
            attestation.latestReportByAttesterAndAgentId(attester, 42);

        assertEq(storedReport.agentId, 42);
        assertEq(storedReport.subject, subject);
        assertEq(storedReport.reportHash, reportHash);
        assertEq(storedReport.score, 87);
        assertEq(storedReport.reportURI, reportURI);
        assertEq(storedReport.attester, attester);
        assertEq(storedReport.timestamp, uint64(block.timestamp));
    }

    function test_AttestAgentReportStoresLatestBySubject() public {
        vm.prank(attester);

        attestation.attestAgentReport(42, subject, reportHash, 87, reportURI);

        AgentPreflightAttestation.ReportPointer memory storedReport =
            attestation.latestReportByAttesterAndSubject(attester, subject);

        assertEq(storedReport.subject, subject);
        assertEq(storedReport.reportHash, reportHash);
    }

    function test_AttestAgentReportStoresByHash() public {
        vm.prank(attester);

        attestation.attestAgentReport(42, subject, reportHash, 87, reportURI);

        (uint256 storedAgentId,, bytes32 storedHash,,,,) = attestation.reportByHashAndAttester(reportHash, attester);

        assertEq(storedAgentId, 42);
        assertEq(storedHash, reportHash);
    }

    function test_AllowsAgentIdZeroForSubjectOnlyReportsWithoutAgentSlotCollision() public {
        vm.prank(attester);

        attestation.attestAgentReport(0, subject, reportHash, 87, reportURI);

        AgentPreflightAttestation.ReportPointer memory storedSubjectReport =
            attestation.latestReportByAttesterAndSubject(attester, subject);
        AgentPreflightAttestation.ReportPointer memory storedAgentReport =
            attestation.latestReportByAttesterAndAgentId(attester, 0);

        assertEq(storedSubjectReport.subject, subject);
        assertEq(storedSubjectReport.reportHash, reportHash);
        assertEq(storedAgentReport.agentId, 0);
        assertEq(storedAgentReport.reportHash, bytes32(0));
    }

    function test_DoesNotLetDifferentAttestersOverwriteLatestPointers() public {
        address otherAttester = makeAddr("otherAttester");
        bytes32 otherHash = keccak256("other-report");

        vm.prank(attester);
        attestation.attestAgentReport(42, subject, reportHash, 87, reportURI);

        vm.prank(otherAttester);
        attestation.attestAgentReport(42, subject, otherHash, 12, "https://preflight.example/reports/other.json");

        AgentPreflightAttestation.ReportPointer memory storedReport =
            attestation.latestReportByAttesterAndAgentId(attester, 42);
        AgentPreflightAttestation.ReportPointer memory otherStoredReport =
            attestation.latestReportByAttesterAndAgentId(otherAttester, 42);

        assertEq(storedReport.score, 87);
        assertEq(storedReport.attester, attester);
        assertEq(otherStoredReport.reportHash, otherHash);
        assertEq(otherStoredReport.score, 12);
        assertEq(otherStoredReport.attester, otherAttester);
    }

    function test_RevertWhen_SubjectIsZero() public {
        vm.expectRevert(AgentPreflightAttestation.EmptySubject.selector);

        attestation.attestAgentReport(42, address(0), reportHash, 87, reportURI);
    }

    function test_RevertWhen_ReportHashIsZero() public {
        vm.expectRevert(AgentPreflightAttestation.EmptyReportHash.selector);

        attestation.attestAgentReport(42, subject, bytes32(0), 87, reportURI);
    }

    function test_RevertWhen_ScoreAboveMax() public {
        vm.expectRevert(abi.encodeWithSelector(AgentPreflightAttestation.InvalidScore.selector, 101));

        attestation.attestAgentReport(42, subject, reportHash, 101, reportURI);
    }

    function test_RevertWhen_ReportURIIsEmpty() public {
        vm.expectRevert(AgentPreflightAttestation.EmptyReportURI.selector);

        attestation.attestAgentReport(42, subject, reportHash, 87, "");
    }

    function test_RevertWhen_ReportURIIsTooLong() public {
        string memory longURI = string.concat("ipfs://", new string(513));

        vm.expectRevert(
            abi.encodeWithSelector(AgentPreflightAttestation.ReportURITooLong.selector, bytes(longURI).length)
        );

        attestation.attestAgentReport(42, subject, reportHash, 87, longURI);
    }

    function testFuzz_AttestAgentReportStoresURI(string calldata fuzzURI) public {
        vm.assume(bytes(fuzzURI).length > 0);
        vm.assume(bytes(fuzzURI).length <= 512);
        vm.prank(attester);

        attestation.attestAgentReport(42, subject, reportHash, 87, fuzzURI);

        (,,,, string memory storedURI,,) = attestation.reportByHashAndAttester(reportHash, attester);

        assertEq(storedURI, fuzzURI);
    }
}
